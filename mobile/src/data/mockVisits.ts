import type {SavedVisitNote} from '../models/Visit';
import {mockPatients} from './mockPatients';

export const mockSavedVisits: SavedVisitNote[] = [
  {
    id: 'saved-demo-001',
    patient: mockPatients[0],
    savedAt: 'Jun 12, 2026 • 10:30 AM',
    transcript: {
      patientId: mockPatients[0].id,
      content: 'Synthetic saved transcript for local demo history.',
    },
    retrievedContext: {
      patientId: mockPatients[0].id,
      summary: '1 previous local hypertension follow-up found.',
    },
    soapNote: {
      subjective: 'Patient reports intermittent dizziness after missed meals.',
      objective: 'BP 124/82 mmHg. Pulse 78/min. No acute distress.',
      assessment: 'Stable hypertension with possible dehydration contribution.',
      plan: 'Continue medication, hydration counseling, follow up in 4 weeks.',
    },
  },
];
