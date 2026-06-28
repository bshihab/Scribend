import React from 'react';
import {StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {StatusBadge} from './StatusBadge';
import {ScribendCopy} from '../copy/ScribendCopy';
import {OfflineWifiIcon} from '../icons/ScribendIcons';
import {spacing} from '../theme/spacing';
import {colors} from '../theme/colors';

export const OfflineStatusBanner = ({compactBadge = false}: {compactBadge?: boolean}) => (
  <GlassCard compact>
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <OfflineWifiIcon size={22} color={colors.teal} />
      </View>
      <View style={styles.textColumn}>
        <AppText variant="section" color={colors.textPrimary}>
          {ScribendCopy.OFFLINE_MODE_ACTIVE}
        </AppText>
        <AppText variant="caption">{ScribendCopy.OFFLINE_MODE_DESC}</AppText>
      </View>
      <View style={compactBadge && styles.compactBadge}>
        <StatusBadge label={ScribendCopy.OFFLINE_BADGE} />
      </View>
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(47,230,202,0.1)',
  },
  textColumn: {
    flex: 1,
  },
  compactBadge: {
    transform: [{scale: 0.92}],
  },
});
