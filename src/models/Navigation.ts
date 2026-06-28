import type {NavigatorScreenParams} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {PatientGender} from './Patient';

export type ScribendStackParamList = {
  Welcome: undefined;
  Permissions: undefined;
  Home: undefined;
  HomeTabs: NavigatorScreenParams<ScribendTabParamList> | undefined;
  PatientType: undefined;
  SelectPatient: {gender: PatientGender; errorMessage?: string};
  AddNewPatient: {gender: PatientGender};
  PatientDetail: {patientId: string};
  VisitInProgress: {patientId: string; gender: PatientGender};
  SoapNote: {visitId: string; readOnly?: boolean};
  Saved: {visitId: string};
  PatientHistory: undefined;
};

export type ScribendTabParamList = {
  HomeDashboard: undefined;
  Patients: undefined;
  PatientHistory: undefined;
  Notes: undefined;
  Profile: undefined;
};

export type ScribendScreenProps<T extends keyof ScribendStackParamList> =
  NativeStackScreenProps<ScribendStackParamList, T>;

export type ScribendTabScreenProps<T extends keyof ScribendTabParamList> =
  BottomTabScreenProps<ScribendTabParamList, T>;
