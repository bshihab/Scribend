import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const LoadingState = ({message}: {message: string}) => (
  <GlassCard compact>
    <View style={styles.row}>
      <ActivityIndicator color={colors.teal} />
      <AppText>{message}</AppText>
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
