import {fallbackSoapNote, isSoapNoteEmpty} from '../src/models/SoapNote';
import {normalizeSoapNote} from '../src/utils/soapFallback';

describe('SOAP fallback', () => {
  it('uses a readable fallback for missing notes', () => {
    const note = normalizeSoapNote(null);
    expect(note).toBeDefined();
    expect(note.subjective).toBe('No note generated');
  });

  it('detects empty SOAP notes', () => {
    expect(isSoapNoteEmpty(fallbackSoapNote(''))).toBe(false);
  });
});
