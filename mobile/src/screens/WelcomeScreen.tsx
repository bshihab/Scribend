import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {GlassCard} from '../components/GlassCard';
import {PrimaryButton} from '../components/PrimaryButton';
import {StatusBadge} from '../components/StatusBadge';
import {ScribendCopy} from '../copy/ScribendCopy';
import {ScribendLogoIcon} from '../icons/ScribendIcons';
import type {ScribendScreenProps} from '../models/Navigation';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const WelcomeScreen = ({navigation}: ScribendScreenProps<'Welcome'>) => (
  <AppScreen>
    <GlassCard style={styles.hero}>
      <ScribendLogoIcon size={62} />
      <AppText variant="display" color={colors.textPrimary}>
        {ScribendCopy.APP_NAME}
      </AppText>
      <View style={styles.tagline}>
        <AppText variant="title" color={colors.textPrimary}>
          {ScribendCopy.TAGLINE_PRIVACY}
        </AppText>
        <AppText variant="title" color={colors.textPrimary}>
          {ScribendCopy.TAGLINE_DEVICE}
        </AppText>
        <AppText variant="title" color={colors.textPrimary}>
          {ScribendCopy.TAGLINE_PATIENTS}
        </AppText>
      </View>
      <StatusBadge label={ScribendCopy.OFFLINE_BADGE} />
    </GlassCard>
    <PrimaryButton label={ScribendCopy.CONTINUE} onPress={() => navigation.navigate('Permissions')} />
  </AppScreen>
);

const styles = StyleSheet.create({
  hero: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  tagline: {
    gap: spacing.xs,
  },
});
