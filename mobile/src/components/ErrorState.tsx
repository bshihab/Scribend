import React from 'react';
import {StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {SecondaryButton} from './SecondaryButton';
import {ScribendCopy} from '../copy/ScribendCopy';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const ErrorState = ({message, onRetry}: {message: string; onRetry?: () => void}) => (
  <GlassCard compact>
    <View style={styles.stack}>
      <AppText variant="section" color={colors.error}>
        {message}
      </AppText>
      {onRetry ? <SecondaryButton label={ScribendCopy.RETRY} onPress={onRetry} /> : null}
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
});
