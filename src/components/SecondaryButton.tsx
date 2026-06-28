import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const SecondaryButton = ({label, onPress, disabled, accessibilityLabel}: SecondaryButtonProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
    disabled={disabled}
    onPress={onPress}
    style={({pressed}) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
    <AppText variant="button" color={disabled ? colors.textMuted : colors.textPrimary}>
      {label}
    </AppText>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: spacing.touchTarget,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
});
