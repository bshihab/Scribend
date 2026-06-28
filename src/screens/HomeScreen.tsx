import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {GlassCard} from '../components/GlassCard';
import {FeatureBox} from '../components/FeatureBox';
import {OfflineStatusBanner} from '../components/OfflineStatusBanner';
import {PrimaryButton} from '../components/PrimaryButton';
import {SecondaryButton} from '../components/SecondaryButton';
import {ScribendCopy} from '../copy/ScribendCopy';
import {ClinicianIcon, DatabaseIcon} from '../icons/ScribendIcons';
import type {ScribendScreenProps} from '../models/Navigation';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const HomeScreen = ({navigation}: ScribendScreenProps<'Home'>) => (
  <AppScreen>
    <View style={styles.header}>
      <AppText variant="caption" color={colors.teal}>
        {ScribendCopy.OFFLINE_BADGE}
      </AppText>
      <AppText variant="headline" color={colors.textPrimary}>
        {ScribendCopy.APP_NAME}
      </AppText>
      <AppText>{ScribendCopy.LOCAL_FOOTER}</AppText>
    </View>
    <OfflineStatusBanner compactBadge />
    <GlassCard style={styles.startCard}>
      <View style={styles.startRow}>
        <ClinicianIcon size={42} color={colors.primaryBlue} />
        <View style={styles.startCopy}>
          <AppText variant="title" color={colors.textPrimary}>
            {ScribendCopy.START_VISIT}
          </AppText>
          <AppText variant="caption">{ScribendCopy.DEMO_ENCOUNTER_DESC}</AppText>
        </View>
      </View>
    </GlassCard>
    <View style={styles.actions}>
      <PrimaryButton label={ScribendCopy.START_VISIT} onPress={() => navigation.navigate('PatientType')} />
      <SecondaryButton label={ScribendCopy.PATIENT_HISTORY} onPress={() => navigation.navigate('PatientHistory')} />
    </View>
    <FeatureBox icon={<DatabaseIcon size={34} color={colors.cyan} />} title={ScribendCopy.LOCAL_ONLY_TITLE} description={ScribendCopy.LOCAL_ONLY_DESC} />
    <AppText variant="caption" style={styles.footer}>
      {ScribendCopy.LOCAL_FOOTER}
    </AppText>
  </AppScreen>
);

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  startCard: {
    backgroundColor: colors.glassStrong,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  startCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
