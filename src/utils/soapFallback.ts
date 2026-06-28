import {fallbackSoapNote, isSoapNoteEmpty} from '../models/SoapNote';
import type {SoapNote} from '../models/SoapNote';

export const normalizeSoapNote = (note?: SoapNote | null, readableFallback?: string): SoapNote =>
  isSoapNoteEmpty(note) ? fallbackSoapNote(readableFallback) : note!;
