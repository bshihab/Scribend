export type PatientGender = 'male' | 'female';

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: PatientGender;
  lastVisitDate: string;
  primaryCondition: string;
  currentMedications: string;
  allergies: string;
}

export const genderLabel = (gender: PatientGender) => (gender === 'male' ? 'Male' : 'Female');

export const patientInitials = (patient: Patient) =>
  patient.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
