import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {ScribendStackParamList} from '../models/Navigation';
import {WelcomeScreen} from '../screens/WelcomeScreen';
import {PermissionsScreen} from '../screens/PermissionsScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {PatientTypeScreen} from '../screens/PatientTypeScreen';
import {SelectPatientScreen} from '../screens/SelectPatientScreen';
import {AddNewPatientScreen} from '../screens/AddNewPatientScreen';
import {VisitInProgressScreen} from '../screens/VisitInProgressScreen';
import {SoapNoteScreen} from '../screens/SoapNoteScreen';
import {SavedScreen} from '../screens/SavedScreen';
import {PatientHistoryScreen} from '../screens/PatientHistoryScreen';
import {colors} from '../theme/colors';

const Stack = createNativeStackNavigator<ScribendStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    primary: colors.teal,
    border: colors.glassBorder,
  },
};

export const ScribendNavigator = () => (
  <NavigationContainer theme={navigationTheme}>
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PatientType" component={PatientTypeScreen} />
      <Stack.Screen name="SelectPatient" component={SelectPatientScreen} />
      <Stack.Screen name="AddNewPatient" component={AddNewPatientScreen} />
      <Stack.Screen name="VisitInProgress" component={VisitInProgressScreen} />
      <Stack.Screen name="SoapNote" component={SoapNoteScreen} />
      <Stack.Screen name="Saved" component={SavedScreen} />
      <Stack.Screen name="PatientHistory" component={PatientHistoryScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
