import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const PrimaryButton = ({label, onPress, disabled, accessibilityLabel}: PrimaryButtonProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
    disabled={disabled}
    onPress={onPress}
    style={({pressed}) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
    <View style={styles.innerHighlight} />
    <AppText variant="button" color={colors.white}>
      {label}
    </AppText>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: spacing.touchTarget,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBlue,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.teal,
    opacity: 0.13,
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    transform: [{scale: 0.99}],
  },
});
