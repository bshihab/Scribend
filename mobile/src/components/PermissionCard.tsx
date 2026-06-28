import React from 'react';
import {StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {StatusBadge} from './StatusBadge';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

interface PermissionCardProps {
  title: string;
  description: string;
  status: string;
  icon: React.ReactNode;
}

export const PermissionCard = ({title, description, status, icon}: PermissionCardProps) => {
  const badgeColor = status === 'Granted' ? colors.success : status === 'Denied' ? colors.error : colors.warning;
  return (
    <GlassCard compact>
      <View style={styles.row}>
        {icon}
        <View style={styles.copy}>
          <AppText variant="section" color={colors.textPrimary}>
            {title}
          </AppText>
          <AppText variant="caption">{description}</AppText>
        </View>
        <StatusBadge label={status} color={badgeColor} />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
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
