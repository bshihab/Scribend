import {ScribendCopy} from '../copy/ScribendCopy';
import type {PatientGender} from '../models/Patient';

export const validatePatientForm = (fullName: string, age: string, gender?: PatientGender) => {
  if (!fullName.trim()) {
    return ScribendCopy.NAME_REQUIRED;
  }
  const numericAge = Number(age);
  if (!Number.isInteger(numericAge) || numericAge <= 0 || numericAge > 130) {
    return ScribendCopy.AGE_INVALID;
  }
  if (!gender) {
    return ScribendCopy.GENDER_REQUIRED;
  }
  return null;
};
