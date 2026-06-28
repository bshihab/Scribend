import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {ScribendStackParamList, ScribendTabParamList} from '../models/Navigation';
import {WelcomeScreen} from '../screens/WelcomeScreen';
import {PermissionsScreen} from '../screens/PermissionsScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {PatientTypeScreen} from '../screens/PatientTypeScreen';
import {SelectPatientScreen} from '../screens/SelectPatientScreen';
import {AddNewPatientScreen} from '../screens/AddNewPatientScreen';
import {PatientDetailScreen} from '../screens/PatientDetailScreen';
import {VisitInProgressScreen} from '../screens/VisitInProgressScreen';
import {SoapNoteScreen} from '../screens/SoapNoteScreen';
import {SavedScreen} from '../screens/SavedScreen';
import {PatientHistoryScreen} from '../screens/PatientHistoryScreen';
import {NotesScreen} from '../screens/NotesScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {BottomTabBar} from '../components/HealthcareComponents';
import {ScribendCopy} from '../copy/ScribendCopy';
import {colors} from '../theme/colors';

const Stack = createNativeStackNavigator<ScribendStackParamList>();
const Tabs = createBottomTabNavigator<ScribendTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    primary: colors.greenPrimary,
    border: colors.glassBorder,
  },
};

const HomeTabs = () => (
  <Tabs.Navigator
    tabBar={props => <BottomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}>
    <Tabs.Screen name="HomeDashboard" component={HomeScreen} options={{title: ScribendCopy.HOME_DASHBOARD}} />
    <Tabs.Screen name="Patients" component={PatientHistoryScreen} options={{title: ScribendCopy.PATIENTS}} />
    <Tabs.Screen name="PatientHistory" component={PatientHistoryScreen} options={{title: ScribendCopy.HISTORY}} />
    <Tabs.Screen name="Notes" component={NotesScreen} options={{title: ScribendCopy.NOTES}} />
    <Tabs.Screen name="Profile" component={ProfileScreen} options={{title: ScribendCopy.PROFILE}} />
  </Tabs.Navigator>
);

export const ScribendNavigator = () => (
  <NavigationContainer theme={navigationTheme}>
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="Home" component={HomeTabs} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="PatientType" component={PatientTypeScreen} />
      <Stack.Screen name="SelectPatient" component={SelectPatientScreen} />
      <Stack.Screen name="AddNewPatient" component={AddNewPatientScreen} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
      <Stack.Screen name="VisitInProgress" component={VisitInProgressScreen} />
      <Stack.Screen name="SoapNote" component={SoapNoteScreen} />
      <Stack.Screen name="Saved" component={SavedScreen} />
      <Stack.Screen name="PatientHistory" component={PatientHistoryScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
