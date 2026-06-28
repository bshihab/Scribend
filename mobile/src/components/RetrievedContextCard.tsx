import React from 'react';
import {View, StyleSheet} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {ScribendCopy} from '../copy/ScribendCopy';
import {DatabaseIcon} from '../icons/ScribendIcons';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const RetrievedContextCard = ({context}: {context?: string}) => (
  <GlassCard compact>
    <View style={styles.header}>
      <DatabaseIcon color={colors.cyan} />
      <AppText variant="section" color={colors.cyan}>
        {ScribendCopy.RETRIEVED_PATIENT_CONTEXT}
      </AppText>
    </View>
    <AppText color={colors.textPrimary}>{context || ScribendCopy.NO_LOCAL_CONTEXT}</AppText>
  </GlassCard>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});
