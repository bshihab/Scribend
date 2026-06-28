import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';
import {colors} from '../theme/colors';

export const GlassPanel = ({style, children, ...props}: ViewProps) => (
  <View {...props} style={[styles.root, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
});
