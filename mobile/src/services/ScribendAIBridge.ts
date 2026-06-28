import type {SoapNote} from '../models/SoapNote';

// Whisper consumes a mono 16 kHz PCM waveform (Float32 samples in [-1, 1]),
// captured live by AudioCapture — not a file path.
export type AudioWaveform = Float32Array | number[];

export interface ScribendAIBridge {
  transcribeAudio(waveform: AudioWaveform): Promise<string>;
  retrievePatientContext(patientId: string, transcript: string): Promise<string>;
  generateSoapNote(patientId: string, transcript: string, context: string): Promise<SoapNote>;
}
