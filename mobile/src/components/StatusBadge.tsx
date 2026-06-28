import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';

interface StatusBadgeProps {
  label: string;
  color?: string;
}

export const StatusBadge = ({label, color = colors.teal}: StatusBadgeProps) => (
  <View style={[styles.badge, {borderColor: color, backgroundColor: `${color}22`}]}>
    <AppText variant="caption" color={color}>
      {label}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
