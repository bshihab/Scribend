import type {SoapNote} from '../models/SoapNote';
import type {ScribendAIBridge} from './ScribendAIBridge';

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export class MockScribendAIBridge implements ScribendAIBridge {
  async transcribeAudio(_audioPath: string): Promise<string> {
    await delay(700);
    return 'Patient reports headache and dizziness for 2 days. Mild fever last night. Good appetite.';
  }

  async retrievePatientContext(_patientId: string, _transcript: string): Promise<string> {
    await delay(700);
    return '2 previous visits found locally. No known drug allergies. Prior medication history available.';
  }

  async generateSoapNote(_patientId: string, _transcript: string, _context: string): Promise<SoapNote> {
    await delay(700);
    return {
      subjective: 'Patient reports headache and dizziness for 2 days. Mild fever last night. Good appetite.',
      objective: 'BP 120/80 mmHg. Pulse 84/min. Temperature 98.6°F. No acute distress.',
      assessment: 'Tension-type headache. Uncomplicated.',
      plan: 'Paracetamol 650 mg as needed. Rest, fluids, hydration. Follow up if symptoms worsen.',
    };
  }
}
