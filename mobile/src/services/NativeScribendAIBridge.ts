import {NativeModules} from 'react-native';
import type {SoapNote} from '../models/SoapNote';
import type {AudioWaveform, ScribendAIBridge} from './ScribendAIBridge';

const {ScribendNativeModule} = NativeModules;

export class NativeScribendAIBridge implements ScribendAIBridge {
  private get module() {
    if (!ScribendNativeModule) {
      throw new Error('Scribend native AI module is not connected yet.');
    }
    return ScribendNativeModule;
  }

  async transcribeAudio(waveform: AudioWaveform): Promise<string> {
    // TODO: Dev 1 will connect this module to Android native ExecuTorch runtime later.
    return this.module.transcribeAudio(Array.from(waveform));
  }

  async retrievePatientContext(patientId: string, transcript: string): Promise<string> {
    // TODO: Dev 1 will connect this module to local sqlite-vec retrieval later.
    return this.module.retrievePatientContext(patientId, transcript);
  }

  async generateSoapNote(patientId: string, transcript: string, context: string): Promise<SoapNote> {
    // TODO: Dev 1 will connect this module to Android native ExecuTorch runtime later.
    return this.module.generateSoapNote(patientId, transcript, context);
  }
}
