import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {ScribendCopy} from '../copy/ScribendCopy';
import type {Patient} from '../models/Patient';
import {genderLabel, patientInitials} from '../models/Patient';
import {PatientAvatarIcon} from '../icons/ScribendIcons';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

export const PatientCard = ({patient, onPress}: PatientCardProps) => (
  <Pressable accessibilityRole="button" accessibilityLabel={patient.fullName} onPress={onPress}>
    {({pressed}) => (
      <GlassCard compact style={pressed && styles.pressed}>
        <View style={styles.row}>
          <PatientAvatarIcon initials={patientInitials(patient)} />
          <View style={styles.copy}>
            <AppText variant="section" color={colors.textPrimary}>
              {patient.fullName}
            </AppText>
            <AppText variant="caption">
              {patient.age} y • {genderLabel(patient.gender)}
            </AppText>
            <AppText variant="caption">
              {ScribendCopy.LAST_VISIT}: {patient.lastVisitDate}
            </AppText>
            <AppText variant="body" color={colors.textPrimary} numberOfLines={2}>
              {patient.primaryCondition}
            </AppText>
          </View>
          <AppText variant="title" color={colors.textMuted}>
            &gt;
          </AppText>
        </View>
      </GlassCard>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
  },
});
