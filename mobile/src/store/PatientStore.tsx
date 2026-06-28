import React, {createContext, useContext, useMemo, useState} from 'react';
import {ScribendCopy} from '../copy/ScribendCopy';
import {mockPatients} from '../data/mockPatients';
import type {Patient, PatientGender} from '../models/Patient';
import {filterPatientsByGender, searchPatients} from '../utils/patientFilters';
import {makeLocalId} from '../utils/ids';
import {validatePatientForm} from '../utils/validators';

interface PatientStoreValue {
  patients: Patient[];
  findPatient: (patientId: string) => Patient | undefined;
  patientsForGender: (gender: PatientGender, query?: string) => Patient[];
  addPatient: (input: AddPatientInput) => {ok: true; patient: Patient} | {ok: false; error: string};
}

interface AddPatientInput {
  fullName: string;
  age: string;
  gender?: PatientGender;
  primaryCondition: string;
  currentMedications: string;
  allergies: string;
}

const PatientStoreContext = createContext<PatientStoreValue | undefined>(undefined);

export const PatientStoreProvider = ({children}: {children: React.ReactNode}) => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);

  const value = useMemo<PatientStoreValue>(() => {
    const findPatient = (patientId: string) => patients.find(patient => patient.id === patientId);

    const patientsForGender = (gender: PatientGender, query = '') =>
      searchPatients(filterPatientsByGender(patients, gender), query);

    const addPatient = (input: AddPatientInput) => {
      const validationError = validatePatientForm(input.fullName, input.age, input.gender);
      if (validationError || !input.gender) {
        return {ok: false as const, error: validationError ?? ScribendCopy.GENDER_REQUIRED};
      }

      const patient: Patient = {
        id: makeLocalId('patient'),
        fullName: input.fullName.trim(),
        age: Number(input.age),
        gender: input.gender,
        lastVisitDate: ScribendCopy.NEW_PATIENT,
        primaryCondition: input.primaryCondition.trim() || ScribendCopy.NOT_SPECIFIED,
        currentMedications: input.currentMedications.trim() || ScribendCopy.NONE_LISTED,
        allergies: input.allergies.trim() || ScribendCopy.NO_KNOWN_ALLERGIES,
      };
      setPatients(current => [...current, patient]);
      return {ok: true as const, patient};
    };

    return {patients, findPatient, patientsForGender, addPatient};
  }, [patients]);

  return <PatientStoreContext.Provider value={value}>{children}</PatientStoreContext.Provider>;
};

export const usePatientStore = () => {
  const context = useContext(PatientStoreContext);
  if (!context) {
    throw new Error('usePatientStore must be used inside PatientStoreProvider');
  }
  return context;
};
