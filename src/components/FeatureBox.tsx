import React from 'react';
import {StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

interface FeatureBoxProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureBox = ({icon, title, description}: FeatureBoxProps) => (
  <GlassCard compact style={styles.card}>
    <View style={styles.row}>
      {icon}
      <View style={styles.copy}>
        <AppText variant="section" color={colors.textPrimary}>
          {title}
        </AppText>
        <AppText variant="caption">{description}</AppText>
      </View>
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassSubtle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});
