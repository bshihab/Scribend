import type {ScribendAIBridge} from './ScribendAIBridge';
import {MockScribendAIBridge} from './MockScribendAIBridge';

export const getScribendAIBridge = (): ScribendAIBridge => new MockScribendAIBridge();
