import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

interface VisitProgressStepProps {
  label: string;
  active: boolean;
  complete: boolean;
}

export const VisitProgressStep = ({label, active, complete}: VisitProgressStepProps) => {
  const color = complete ? colors.success : active ? colors.primaryBlue : colors.textMuted;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <AppText variant="caption" color={active || complete ? colors.textPrimary : colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
