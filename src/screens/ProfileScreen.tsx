import React from 'react';
import {StyleSheet, View} from 'react-native';
import {CheckCircle, Stethoscope} from 'lucide-react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {AppHeader, InfoCard, PatientAvatar, StatusChip} from '../components/HealthcareComponents';
import {ScribendCopy} from '../copy/ScribendCopy';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const ProfileScreen = () => (
  <AppScreen>
    <AppHeader title={ScribendCopy.PROFILE} subtitle={ScribendCopy.LOCAL_FOOTER} />
    <View style={styles.profileCard}>
      <PatientAvatar initials="DM" size={74} showOnline />
      <AppText variant="headline" color={colors.textPrimary}>
        {ScribendCopy.DOCTOR_NAME}
      </AppText>
      <StatusChip label={ScribendCopy.CONNECTED} tone="green" />
    </View>
    <InfoCard title={ScribendCopy.AI_SCRIBE_READY} icon={<Stethoscope size={18} color={colors.greenPrimary} />}>
      <AppText>{ScribendCopy.AI_SCRIBE_READY_DESC}</AppText>
    </InfoCard>
    <InfoCard title={ScribendCopy.OFFLINE_MODE_ACTIVE} icon={<CheckCircle size={18} color={colors.greenPrimary} />}>
      <AppText>{ScribendCopy.OFFLINE_MODE_DESC}</AppText>
    </InfoCard>
  </AppScreen>
);

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
});
