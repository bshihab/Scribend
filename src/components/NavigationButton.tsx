import React from 'react';
import {Pressable, StyleSheet, Text, ViewStyle} from 'react-native';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {shadows} from '../theme/shadows';

interface NavigationButtonProps {
  label: string;
  direction?: 'back' | 'next' | 'action';
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  disabled?: boolean;
}

export const NavigationButton = ({
  label,
  direction = 'action',
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}: NavigationButtonProps) => {
  const symbol = direction === 'back' ? 'Back' : direction === 'next' ? 'Next' : '';
  const text = symbol && label !== symbol ? `${symbol}  ${label}` : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({pressed}) => [
        styles.button,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonStroke,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...(shadows.glass as object),
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.99}],
  },
  disabled: {
    opacity: 0.48,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.darkGreen,
  },
  secondary: {
    backgroundColor: colors.surface,
  },
  ghost: {
    backgroundColor: colors.softGreen,
  },
});