import React, {createContext, useContext, useMemo, useRef, useState} from 'react';
import {audioCapture} from '../ai/AudioCapture';
import {ScribendCopy} from '../copy/ScribendCopy';
import {mockSavedVisits} from '../data/mockVisits';
import type {Patient} from '../models/Patient';
import {fallbackSoapNote, isSoapNoteEmpty, type SoapNote} from '../models/SoapNote';
import type {SavedVisitNote, VisitSession, VisitStatus} from '../models/Visit';
import {getScribendAIBridge} from '../services/getScribendAIBridge';
import {makeLocalId} from '../utils/ids';

interface VisitStoreValue {
  currentVisit: VisitSession;
  savedVisits: SavedVisitNote[];
  startVisit: (patient: Patient) => void;
  startRecording: () => void;
  stopRecording: () => Promise<string | undefined>;
  retryProcessing: () => Promise<string | undefined>;
  cancelVisit: () => void;
  updateSoapNote: (note: SoapNote) => void;
  saveCurrentNote: () => {ok: true; visitId: string} | {ok: false; error: string};
  openSavedVisit: (visitId: string) => boolean;
  isCurrentVisitSaved: () => boolean;
  clearCurrentVisit: () => void;
}

const idleVisit: VisitSession = {
  status: 'Idle',
  timerSeconds: 0,
};

const VisitStoreContext = createContext<VisitStoreValue | undefined>(undefined);
const aiBridge = getScribendAIBridge();

export const VisitStoreProvider = ({children}: {children: React.ReactNode}) => {
  const [currentVisit, setCurrentVisit] = useState<VisitSession>(idleVisit);
  const [savedVisits, setSavedVisits] = useState<SavedVisitNote[]>(mockSavedVisits);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSecondsRef = useRef(0);
  // Mic samples captured for the current recording, fed to Whisper on stop.
  const waveformRef = useRef<Float32Array>(new Float32Array(0));

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const setStatus = (status: VisitStatus) => {
    setCurrentVisit(current => ({...current, status, errorMessage: undefined}));
  };

  const value = useMemo<VisitStoreValue>(() => {
    const startVisit = (patient: Patient) => {
      stopTimer();
      timerSecondsRef.current = 0;
      setCurrentVisit({status: 'Idle', timerSeconds: 0, patient});
    };

    const startRecording = () => {
      setCurrentVisit(current => {
        if (!current.patient || current.status === 'Recording' || isProcessingStatus(current.status)) {
          return current;
        }
        timerSecondsRef.current = 0;
        stopTimer();
        try {
          audioCapture.start(); // begin live mic capture for Whisper
        } catch (err) {
          console.log('[Scribend] audio capture failed to start', err);
        }
        timerRef.current = setInterval(() => {
          timerSecondsRef.current += 1;
          setCurrentVisit(ticking => ({...ticking, timerSeconds: timerSecondsRef.current}));
        }, 1000);
        return {...current, status: 'Recording', timerSeconds: 0, errorMessage: undefined};
      });
    };

    const finishProcessing = async () => {
      const snapshot = currentVisit;
      if (!snapshot.patient) {
        setCurrentVisit(current => ({...current, status: 'Error', errorMessage: ScribendCopy.INVALID_PATIENT}));
        return undefined;
      }

      try {
        setStatus('Transcribing');
        const transcript = await aiBridge.transcribeAudio(waveformRef.current);
        if (!transcript.trim()) {
          throw new Error(ScribendCopy.TRANSCRIPT_EMPTY);
        }

        setCurrentVisit(current => ({
          ...current,
          transcript: {patientId: snapshot.patient!.id, content: transcript},
        }));

        setStatus('ExtractingHistory');
        const context = await aiBridge.retrievePatientContext(snapshot.patient.id, transcript);
        setCurrentVisit(current => ({
          ...current,
          retrievedContext: {patientId: snapshot.patient!.id, summary: context},
        }));

        setStatus('GeneratingNote');
        const note = await aiBridge.generateSoapNote(snapshot.patient.id, transcript, context);
        if (isSoapNoteEmpty(note)) {
          throw new Error(ScribendCopy.SOAP_GENERATION_FAILED);
        }
        const visitId = makeLocalId('visit');
        setCurrentVisit(current => ({
          ...current,
          id: visitId,
          soapNote: note,
          status: 'Complete',
        }));
        return visitId;
      } catch (error) {
        setCurrentVisit(current => ({
          ...current,
          status: 'Error',
          errorMessage: error instanceof Error ? error.message : ScribendCopy.SOAP_GENERATION_FAILED,
        }));
        return undefined;
      }
    };

    const stopRecording = async () => {
      if (currentVisit.status !== 'Recording') {
        return undefined;
      }
      stopTimer();
      // Stop the mic and keep the captured waveform for Whisper.
      try {
        waveformRef.current = audioCapture.stop();
      } catch (err) {
        console.log('[Scribend] audio capture failed to stop', err);
        waveformRef.current = new Float32Array(0);
      }
      if (timerSecondsRef.current < 3) {
        setCurrentVisit(current => ({
          ...current,
          status: 'Idle',
          errorMessage: ScribendCopy.RECORDING_TOO_SHORT,
        }));
        return undefined;
      }
      return finishProcessing();
    };

    const retryProcessing = async () => {
      timerSecondsRef.current = 3;
      setCurrentVisit(current => ({...current, status: 'Recording', timerSeconds: 3}));
      return finishProcessing();
    };

    const cancelVisit = () => {
      stopTimer();
      timerSecondsRef.current = 0;
      setCurrentVisit(idleVisit);
    };

    const updateSoapNote = (note: SoapNote) => {
      setCurrentVisit(current => ({...current, soapNote: note}));
    };

    const isCurrentVisitSaved = () =>
      Boolean(currentVisit.id && savedVisits.some(note => note.id === currentVisit.id));

    const saveCurrentNote = () => {
      if (!currentVisit.id || !currentVisit.patient) {
        return {ok: false as const, error: ScribendCopy.SAVE_FAILED};
      }
      if (isCurrentVisitSaved()) {
        return {ok: false as const, error: ScribendCopy.ALREADY_SAVED};
      }
      const savedNote: SavedVisitNote = {
        id: currentVisit.id,
        patient: currentVisit.patient,
        savedAt: new Date().toLocaleString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        transcript: currentVisit.transcript ?? {patientId: currentVisit.patient.id, content: ''},
        retrievedContext: currentVisit.retrievedContext ?? {patientId: currentVisit.patient.id, summary: ''},
        soapNote: currentVisit.soapNote ?? fallbackSoapNote(),
      };
      setSavedVisits(current => [savedNote, ...current]);
      setCurrentVisit(current => ({...current, readOnly: true}));
      return {ok: true as const, visitId: savedNote.id};
    };

    const openSavedVisit = (visitId: string) => {
      const savedVisit = savedVisits.find(note => note.id === visitId);
      if (!savedVisit) {
        return false;
      }
      stopTimer();
      setCurrentVisit({
        id: savedVisit.id,
        patient: savedVisit.patient,
        status: 'Complete',
        timerSeconds: 0,
        transcript: savedVisit.transcript,
        retrievedContext: savedVisit.retrievedContext,
        soapNote: savedVisit.soapNote,
        readOnly: true,
      });
      return true;
    };

    const clearCurrentVisit = () => {
      cancelVisit();
    };

    return {
      currentVisit,
      savedVisits,
      startVisit,
      startRecording,
      stopRecording,
      retryProcessing,
      cancelVisit,
      updateSoapNote,
      saveCurrentNote,
      openSavedVisit,
      isCurrentVisitSaved,
      clearCurrentVisit,
    };
  }, [currentVisit, savedVisits]);

  return <VisitStoreContext.Provider value={value}>{children}</VisitStoreContext.Provider>;
};

export const useVisitStore = () => {
  const context = useContext(VisitStoreContext);
  if (!context) {
    throw new Error('useVisitStore must be used inside VisitStoreProvider');
  }
  return context;
};

const isProcessingStatus = (status: VisitStatus) =>
  status === 'Transcribing' || status === 'ExtractingHistory' || status === 'GeneratingNote';
