import type {SoapNote} from '../models/SoapNote';

export interface ScribendAIBridge {
  transcribeAudio(audioPath: string): Promise<string>;
  retrievePatientContext(patientId: string, transcript: string): Promise<string>;
  generateSoapNote(patientId: string, transcript: string, context: string): Promise<SoapNote>;
}
