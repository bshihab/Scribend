import type {VisitStatus} from '../models/Visit';

export const processingSequence: VisitStatus[] = [
  'Transcribing',
  'ExtractingHistory',
  'GeneratingNote',
  'Complete',
];

export const isProcessingVisitStatus = (status: VisitStatus) =>
  status === 'Transcribing' || status === 'ExtractingHistory' || status === 'GeneratingNote';
