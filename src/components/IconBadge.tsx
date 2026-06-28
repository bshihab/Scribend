import React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import {colors} from '../theme/colors';

interface IconBadgeProps {
  symbol: string;
  label?: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  style?: ViewStyle;
}

export const IconBadge = ({
  symbol,
  label,
  size = 56,
  backgroundColor = colors.softGreen,
  color = colors.darkGreen,
  style,
}: IconBadgeProps) => (
  <View
    accessibilityLabel={label}
    style={[
      styles.badge,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
      },
      style,
    ]}>
    <Text
      allowFontScaling={false}
      style={[
        styles.symbol,
        {
          color,
          fontSize: Math.max(16, Math.round(size * 0.38)),
        },
      ]}>
      {symbol}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.buttonStroke,
  },
  symbol: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
});