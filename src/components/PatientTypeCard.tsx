import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';

interface PatientTypeCardProps {
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  onPress: () => void;
}

export const PatientTypeCard = ({label, icon, accentColor, onPress}: PatientTypeCardProps) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
    {({pressed}) => (
      <GlassCard style={[styles.card, pressed && styles.pressed]}>
        <View style={[styles.iconBubble, {backgroundColor: `${accentColor}24`}]}>{icon}</View>
        <AppText variant="title" color={colors.textPrimary}>
          {label}
        </AppText>
      </GlassCard>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    gap: spacing.md,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
