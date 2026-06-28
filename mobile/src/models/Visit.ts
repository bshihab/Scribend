import type {Patient} from './Patient';
import type {SoapNote} from './SoapNote';

export type VisitStatus =
  | 'Idle'
  | 'Recording'
  | 'Transcribing'
  | 'ExtractingHistory'
  | 'GeneratingNote'
  | 'Complete'
  | 'Error';

export interface RetrievedContext {
  patientId: string;
  summary: string;
}

export interface VisitTranscript {
  patientId: string;
  content: string;
}

export interface VisitSession {
  id?: string;
  patient?: Patient;
  status: VisitStatus;
  timerSeconds: number;
  transcript?: VisitTranscript;
  retrievedContext?: RetrievedContext;
  soapNote?: SoapNote;
  errorMessage?: string;
  readOnly?: boolean;
}

export interface SavedVisitNote {
  id: string;
  patient: Patient;
  savedAt: string;
  transcript: VisitTranscript;
  retrievedContext: RetrievedContext;
  soapNote: SoapNote;
}

export const visitSteps: VisitStatus[] = [
  'Recording',
  'Transcribing',
  'ExtractingHistory',
  'GeneratingNote',
  'Complete',
];
