import React from 'react';
import {Text, TextProps, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

type Variant = 'display' | 'headline' | 'title' | 'section' | 'body' | 'caption' | 'button';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export const AppText = ({variant = 'body', color = colors.textSecondary, style, ...props}: AppTextProps) => (
  <Text {...props} style={[styles.base, typography[variant], {color}, style]} />
);

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.roundedFontFamily,
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
