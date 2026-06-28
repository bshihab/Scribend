import type {ScribendAIBridge} from './ScribendAIBridge';
import {ExecutorchAIBridge} from './ExecutorchAIBridge';

// Real on-device AI (Llama via executorch). Swap back to MockScribendAIBridge to demo without models.
let instance: ScribendAIBridge | null = null;
export const getScribendAIBridge = (): ScribendAIBridge => {
  if (!instance) {
    instance = new ExecutorchAIBridge();
  }
  return instance;
};
