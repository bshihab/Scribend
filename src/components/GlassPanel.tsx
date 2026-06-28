import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';
import {colors} from '../theme/colors';

export const GlassPanel = ({style, children, ...props}: ViewProps) => (
  <View {...props} style={[styles.root, style]}>
    <View style={styles.topGlow} />
    <View style={styles.bottomGlow} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: -110,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(54,242,210,0.055)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -140,
    left: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(10,132,255,0.05)',
  },
});
