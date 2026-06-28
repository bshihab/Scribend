import React from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {AppTopBar} from '../components/AppTopBar';
import {PatientTypeCard} from '../components/PatientTypeCard';
import {ScribendCopy} from '../copy/ScribendCopy';
import {FemalePatientIcon, MalePatientIcon} from '../icons/ScribendIcons';
import type {ScribendScreenProps} from '../models/Navigation';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const PatientTypeScreen = ({navigation}: ScribendScreenProps<'PatientType'>) => {
  const {width} = useWindowDimensions();
  const twoColumn = width >= 430;

  return (
    <AppScreen>
      <AppTopBar title={ScribendCopy.SELECT_PATIENT_TYPE} onBack={() => navigation.navigate('Home')} />
      <View style={styles.header}>
        <AppText variant="headline" color={colors.textPrimary}>
          {ScribendCopy.SELECT_PATIENT_TYPE}
        </AppText>
        <AppText>{ScribendCopy.SELECT_PATIENT_TYPE_DESC}</AppText>
      </View>
      <View style={[styles.cardGrid, twoColumn && styles.cardGridWide]}>
        <View style={styles.cardCell}>
          <PatientTypeCard
            label={ScribendCopy.MALE}
            icon={<MalePatientIcon size={42} />}
            accentColor={colors.primaryBlue}
            onPress={() => navigation.navigate('SelectPatient', {gender: 'male'})}
          />
        </View>
        <View style={styles.cardCell}>
          <PatientTypeCard
            label={ScribendCopy.FEMALE}
            icon={<FemalePatientIcon size={42} />}
            accentColor={colors.teal}
            onPress={() => navigation.navigate('SelectPatient', {gender: 'female'})}
          />
        </View>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  cardGrid: {
    gap: spacing.md,
  },
  cardGridWide: {
    flexDirection: 'row',
  },
  cardCell: {
    flex: 1,
  },
});
