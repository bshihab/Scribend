import React from 'react';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {colors} from '../theme/colors';

export const EmptyState = ({message}: {message: string}) => (
  <GlassCard compact>
    <AppText variant="section" color={colors.textPrimary}>
      {message}
    </AppText>
  </GlassCard>
);
