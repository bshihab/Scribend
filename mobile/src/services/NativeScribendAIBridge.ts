import {NativeModules} from 'react-native';
import type {SoapNote} from '../models/SoapNote';
import type {ScribendAIBridge} from './ScribendAIBridge';

const {ScribendNativeModule} = NativeModules;

export class NativeScribendAIBridge implements ScribendAIBridge {
  private get module() {
    if (!ScribendNativeModule) {
      throw new Error('Scribend native AI module is not connected yet.');
    }
    return ScribendNativeModule;
  }

  async transcribeAudio(audioPath: string): Promise<string> {
    // TODO: Dev 1 will connect this module to Android native ExecuTorch runtime later.
    return this.module.transcribeAudio(audioPath);
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
