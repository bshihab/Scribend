export type PatientGender = 'male' | 'female';

export interface PatientMedication {
  name: string;
  dosage: string;
  schedule: string;
}

export interface PatientVital {
  label: string;
  value: string;
  unit?: string;
}

export interface PatientNote {
  date: string;
  preview: string;
}

export interface PatientActivity {
  date: string;
  title: string;
  description: string;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: PatientGender;
  mrn: string;
  status: string;
  lastVisitDate: string;
  primaryCondition: string;
  notePreview: string;
  currentMedications: string;
  allergies: string;
  medications: PatientMedication[];
  vitals: PatientVital[];
  recentNotes: PatientNote[];
  recentActivity: PatientActivity[];
}

export const genderLabel = (gender: PatientGender) => (gender === 'male' ? 'Male' : 'Female');

export const patientInitials = (patient: Patient) =>
  patient.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
