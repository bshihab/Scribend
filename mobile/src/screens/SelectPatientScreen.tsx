import React, {useEffect, useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppTopBar} from '../components/AppTopBar';
import {EmptyState} from '../components/EmptyState';
import {ErrorState} from '../components/ErrorState';
import {PatientCard} from '../components/PatientCard';
import {PrimaryButton} from '../components/PrimaryButton';
import {ScribendCopy} from '../copy/ScribendCopy';
import type {ScribendScreenProps} from '../models/Navigation';
import {usePatientStore} from '../store/PatientStore';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';

export const SelectPatientScreen = ({navigation, route}: ScribendScreenProps<'SelectPatient'>) => {
  const {gender, errorMessage: routeError} = route.params ?? {};
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState(routeError);
  const {patientsForGender, findPatient} = usePatientStore();
  const {startVisit} = useVisitStore();

  useEffect(() => {
    if (gender !== 'male' && gender !== 'female') {
      navigation.replace('PatientType');
    }
  }, [gender, navigation]);

  if (gender !== 'male' && gender !== 'female') {
    return null;
  }

  const patients = patientsForGender(gender, query);

  return (
    <AppScreen>
      <AppTopBar title={ScribendCopy.SELECT_PATIENT} onBack={() => navigation.navigate('PatientType')} />
      {errorMessage ? <ErrorState message={errorMessage} /> : null}
      <TextInput
        accessibilityLabel={ScribendCopy.SEARCH_PATIENTS}
        value={query}
        onChangeText={setQuery}
        placeholder={`${ScribendCopy.SEARCH_PATIENTS} • ${gender}`}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <PrimaryButton label={ScribendCopy.ADD_NEW_PATIENT} onPress={() => navigation.navigate('AddNewPatient', {gender})} />
      <View style={styles.list}>
        {patients.length === 0 ? (
          <EmptyState message={query ? ScribendCopy.NO_MATCHING_PATIENTS : ScribendCopy.NO_PATIENTS} />
        ) : (
          patients.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onPress={() => {
                const selectedPatient = findPatient(patient.id);
                if (!selectedPatient) {
                  setErrorMessage(ScribendCopy.INVALID_PATIENT);
                  return;
                }
                startVisit(selectedPatient);
                navigation.navigate('VisitInProgress', {patientId: selectedPatient.id, gender});
              }}
            />
          ))
        )}
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  input: {
    minHeight: spacing.touchTarget,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glass,
    fontSize: 15,
    lineHeight: 20,
    includeFontPadding: false,
  },
  list: {
    gap: spacing.sm,
  },
});
