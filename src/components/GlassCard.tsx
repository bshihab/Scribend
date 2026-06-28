import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';
import {shadows} from '../theme/shadows';

interface GlassCardProps extends ViewProps {
  compact?: boolean;
}

export const GlassCard = ({style, compact = false, children, ...props}: GlassCardProps) => (
  <View {...props} style={[styles.card, compact && styles.compact, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    ...(shadows.glass as object),
  },
  compact: {
    padding: spacing.md,
  },
});
