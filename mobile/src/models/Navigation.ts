import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {PatientGender} from './Patient';

export type ScribendStackParamList = {
  Welcome: undefined;
  Permissions: undefined;
  Home: undefined;
  PatientType: undefined;
  SelectPatient: {gender: PatientGender; errorMessage?: string};
  AddNewPatient: {gender: PatientGender};
  VisitInProgress: {patientId: string; gender: PatientGender};
  SoapNote: {visitId: string; readOnly?: boolean};
  Saved: {visitId: string};
  PatientHistory: undefined;
};

export type ScribendScreenProps<T extends keyof ScribendStackParamList> =
  NativeStackScreenProps<ScribendStackParamList, T>;
