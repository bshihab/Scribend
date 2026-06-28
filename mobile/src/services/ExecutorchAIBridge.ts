// Real on-device AI bridge using react-native-executorch's imperative LLMModule.
// generateSoapNote() runs Llama 3.2 ON THE DEVICE (CPU/XNNPACK).
//
// Notes:
// - transcribeAudio is a placeholder for now: Whisper needs audio decoding via
//   react-native-audio-api, which doesn't compile on NDK 28 (deferred). So we
//   feed a sample transcript and let Llama do the real work.
// - retrievePatientContext is a stub (sqlite-vec not wired into RN yet).
import {
  LLMModule,
  LLAMA3_2_1B_QLORA, // 1B for a fast first run; switch to LLAMA3_2_3B_QLORA for quality
  type Message,
} from 'react-native-executorch';
import {SOAP_SYSTEM_PROMPT} from '../ai/systemPrompt';
import {fallbackSoapNote, type SoapNote} from '../models/SoapNote';
import type {ScribendAIBridge} from './ScribendAIBridge';

const SAMPLE_TRANSCRIPT =
  'Patient presents with a three-day history of severe headaches. ' +
  'Blood pressure is 152 over 96. Will prescribe lisinopril 10 milligrams once a day.';

export class ExecutorchAIBridge implements ScribendAIBridge {
  private llm = new LLMModule();
  private loadPromise: Promise<void> | null = null;

  // Load (and download on first run) the model exactly once.
  private ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.llm.load(LLAMA3_2_1B_QLORA, p =>
        console.log(`[Scribend] Llama download: ${Math.round(p * 100)}%`),
      );
    }
    return this.loadPromise;
  }

  async transcribeAudio(_audioPath: string): Promise<string> {
    // Whisper deferred — return a sample transcript so the flow runs end-to-end.
    return SAMPLE_TRANSCRIPT;
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
