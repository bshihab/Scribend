import type {Patient, PatientGender} from '../models/Patient';

export const filterPatientsByGender = (patients: Patient[], gender: PatientGender) =>
  patients.filter(patient => patient.gender === gender);

export const searchPatients = (patients: Patient[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return patients;
  }
  return patients.filter(
    patient =>
      patient.fullName.toLowerCase().includes(normalized) ||
      patient.primaryCondition.toLowerCase().includes(normalized),
  );
};
