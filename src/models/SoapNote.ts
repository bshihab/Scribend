export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export const emptySoapNote: SoapNote = {
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};

export const fallbackSoapNote = (readableText?: string | null): SoapNote => ({
  subjective: readableText && readableText.trim() ? readableText : 'No note generated',
  objective: 'Objective details unavailable.',
  assessment: 'Assessment unavailable.',
  plan: 'Plan unavailable.',
});

export const isSoapNoteEmpty = (note?: SoapNote | null) =>
  !note || [note.subjective, note.objective, note.assessment, note.plan].every(value => !value.trim());
