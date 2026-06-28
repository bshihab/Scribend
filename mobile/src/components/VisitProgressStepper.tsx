import React from 'react';
import {StyleSheet, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {VisitProgressStep} from './VisitProgressStep';
import {ScribendCopy} from '../copy/ScribendCopy';
import type {VisitStatus} from '../models/Visit';
import {visitSteps} from '../models/Visit';
import {spacing} from '../theme/spacing';

const labels: Record<VisitStatus, string> = {
  Idle: '',
  Recording: ScribendCopy.RECORDING,
  Transcribing: ScribendCopy.TRANSCRIBING,
  ExtractingHistory: ScribendCopy.EXTRACTING_HISTORY,
  GeneratingNote: ScribendCopy.GENERATING_NOTE,
  Complete: ScribendCopy.COMPLETE,
  Error: '',
};

export const VisitProgressStepper = ({status}: {status: VisitStatus}) => {
  const activeIndex = visitSteps.indexOf(status);
  return (
    <GlassCard compact>
      <View style={styles.stack}>
        {visitSteps.map((step, index) => (
          <VisitProgressStep key={step} label={labels[step]} active={step === status} complete={activeIndex > index} />
        ))}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
  },
});
