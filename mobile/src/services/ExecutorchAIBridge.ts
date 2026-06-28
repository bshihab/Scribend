// Real on-device AI bridge using react-native-executorch.
// - transcribeAudio() runs Whisper ON THE DEVICE (XNNPACK) on the captured mic waveform.
// - generateSoapNote() runs Llama 3.2 ON THE DEVICE (CPU/XNNPACK).
// - retrievePatientContext is a stub (sqlite-vec not wired into RN yet).
import {
  LLMModule,
  // tiny Whisper + 1B Llama: executorch stages model data through the JS heap on
  // load, so the heavier combos (3B / small Whisper) exhaust memory and crash
  // when both are resident. This ~1.5GB pair runs the full pipeline reliably.
  // The prompt fix (one-shot example + no-echo rule) keeps 1B's notes clean.
  LLAMA3_2_1B_QLORA,
  SpeechToTextModule,
  WHISPER_TINY_EN,
  type Message,
} from 'react-native-executorch';
import {SOAP_SYSTEM_PROMPT} from '../ai/systemPrompt';
import {fallbackSoapNote, type SoapNote} from '../models/SoapNote';
import type {AudioWaveform, ScribendAIBridge} from './ScribendAIBridge';

// Used only when no real speech was captured (e.g. running the flow without
// talking) so the end-to-end demo still produces a note.
const SAMPLE_TRANSCRIPT =
  'Patient presents with a three-day history of severe headaches. ' +
  'Blood pressure is 152 over 96. Will prescribe lisinopril 10 milligrams once a day.';

// Below ~1s of audio there's nothing worth transcribing.
const MIN_SAMPLES = 16000;

export class ExecutorchAIBridge implements ScribendAIBridge {
  private llm = new LLMModule();
  private loadPromise: Promise<void> | null = null;

  // Constructed lazily: SpeechToTextModule touches TextDecoder at construction,
  // so we only build it once transcription actually runs.
  private stt: SpeechToTextModule | null = null;
  private sttLoadPromise: Promise<void> | null = null;

  // Load (and download on first run) the Llama model exactly once.
  private ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.llm.load(LLAMA3_2_1B_QLORA, p =>
        console.log(`[Scribend] Llama download: ${Math.round(p * 100)}%`),
      );
    }
    return this.loadPromise;
  }

  // Load (and download on first run) the Whisper model exactly once.
  private ensureSttLoaded(): Promise<void> {
    if (!this.sttLoadPromise) {
      this.stt = new SpeechToTextModule();
      this.sttLoadPromise = this.stt.load(WHISPER_TINY_EN, p =>
        console.log(`[Scribend] Whisper download: ${Math.round(p * 100)}%`),
      );
    }
    return this.sttLoadPromise;
  }

  async transcribeAudio(waveform: AudioWaveform): Promise<string> {
    if (!waveform || waveform.length < MIN_SAMPLES) {
      // No real speech captured — fall back so the demo still completes.
      console.log('[Scribend] No audio captured; using sample transcript');
      return SAMPLE_TRANSCRIPT;
    }
    await this.ensureSttLoaded();
    const raw = (await this.stt!.transcribe(waveform)).trim();
    console.log(`[Scribend] Whisper transcript (${waveform.length} samples): ${raw}`);
    // Drop the Whisper module so its memory is reclaimed before Llama loads —
    // holding Whisper + Llama at once intermittently OOMs the JS heap on-device.
    (this.stt as unknown as {delete?: () => void})?.delete?.();
    this.stt = null;
    this.sttLoadPromise = null;
    // Whisper emits non-speech markers for silence/noise, e.g. [BLANK_AUDIO],
    // [ Pause ], (music). Strip them; if nothing real is left, use the sample.
    const cleaned = raw
      .replace(/[\[(][^\])]*[\])]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || SAMPLE_TRANSCRIPT;
  }

  async retrievePatientContext(_patientId: string, _transcript: string): Promise<string> {
    // sqlite-vec retrieval not wired into RN yet.
    return '';
  }

  async generateSoapNote(
    _patientId: string,
    transcript: string,
    context: string,
  ): Promise<SoapNote> {
    await this.ensureLoaded();
    const userContent = context
      ? `Past patient history:\n${context}\n\nVisit transcript:\n${transcript}`
      : transcript;
    const messages: Message[] = [
      {role: 'system', content: SOAP_SYSTEM_PROMPT},
      {role: 'user', content: userContent},
    ];
    const response = await this.llm.generate(messages);
    return parseSoap(response, transcript);
  }
}

function parseSoap(response: string, transcript: string): SoapNote {
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) {
      return fallbackSoapNote(transcript);
    }
    const obj = JSON.parse(match[0]);
    return {
      subjective: String(obj.subjective ?? '').trim(),
      objective: String(obj.objective ?? '').trim(),
      assessment: String(obj.assessment ?? '').trim(),
      plan: String(obj.plan ?? '').trim(),
    };
  } catch {
    return fallbackSoapNote(transcript);
  }
}
