import React, {useEffect, useState} from 'react';
import {Alert, Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {AppTopBar} from '../components/AppTopBar';
import {ErrorState} from '../components/ErrorState';
import {GlassCard} from '../components/GlassCard';
import {PrimaryButton} from '../components/PrimaryButton';
import {SecondaryButton} from '../components/SecondaryButton';
import {VisitProgressStepper} from '../components/VisitProgressStepper';
import {ScribendCopy} from '../copy/ScribendCopy';
import {MicrophoneIcon} from '../icons/ScribendIcons';
import type {ScribendScreenProps} from '../models/Navigation';
import {genderLabel} from '../models/Patient';
import {usePatientStore} from '../store/PatientStore';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';
import {isProcessingVisitStatus} from '../utils/visitFlow';

export const VisitInProgressScreen = ({navigation, route}: ScribendScreenProps<'VisitInProgress'>) => {
  const {patientId, gender} = route.params;
  const {findPatient} = usePatientStore();
  const {
    currentVisit,
    startVisit,
    startRecording,
    stopRecording,
    retryProcessing,
    cancelVisit,
  } = useVisitStore();
  const [busy, setBusy] = useState(false);
  const {width} = useWindowDimensions();
  const isProcessing = isProcessingVisitStatus(currentVisit.status);
  const isActive = currentVisit.status === 'Recording' || isProcessing;
  const micSize = width >= 430 ? 126 : 116;

  useEffect(() => {
    const patient = findPatient(patientId);
    if (!patient) {
      navigation.replace('SelectPatient', {gender, errorMessage: ScribendCopy.INVALID_PATIENT});
      return;
    }
    if (!currentVisit.patient || currentVisit.patient.id !== patient.id) {
      startVisit(patient);
    }
  }, [currentVisit.patient, findPatient, gender, navigation, patientId, startVisit]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (!isActive) {
        return;
      }
      event.preventDefault();
      confirmDiscard(() => {
        cancelVisit();
        navigation.dispatch(event.data.action);
      });
    });
    return unsubscribe;
  }, [cancelVisit, isActive, navigation]);

  const patient = currentVisit.patient;
  if (!patient) {
    return null;
  }

  const stopAndNavigate = async () => {
    setBusy(true);
    const visitId = await stopRecording();
    setBusy(false);
    if (visitId) {
      setTimeout(() => navigation.navigate('SoapNote', {visitId}), 0);
    }
  };

  const retry = async () => {
    setBusy(true);
    const visitId = await retryProcessing();
    setBusy(false);
    if (visitId) {
      setTimeout(() => navigation.navigate('SoapNote', {visitId}), 0);
    }
  };

  const discard = () => {
    confirmDiscard(() => {
      cancelVisit();
      navigation.navigate('Home');
    });
  };

  return (
    <AppScreen>
      <AppTopBar title={ScribendCopy.VISIT_IN_PROGRESS} onBack={() => (isActive ? discard() : navigation.goBack())} />
      <GlassCard style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.patientCopy}>
            <AppText variant="title" color={colors.textPrimary}>
              {patient.fullName}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {patient.age} y • {genderLabel(patient.gender)}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.cyan} style={styles.condition}>
            {patient.primaryCondition}
          </AppText>
        </View>
      </GlassCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ScribendCopy.MICROPHONE_ACCESS}
        onPress={() => (currentVisit.status === 'Recording' ? stopAndNavigate() : startRecording())}
        style={[styles.micButton, {width: micSize, height: micSize}]}>
        <MicrophoneIcon size={Math.round(micSize * 0.48)} color={currentVisit.status === 'Recording' ? colors.error : colors.teal} />
      </Pressable>
      <GlassCard compact style={styles.timerCard}>
        <AppText variant="headline" color={colors.textPrimary}>
          {formatTimer(currentVisit.timerSeconds)}
        </AppText>
        <AppText variant="caption" color={colors.teal}>
          {currentVisit.status}
        </AppText>
      </GlassCard>
      <VisitProgressStepper status={currentVisit.status} />
      {currentVisit.errorMessage ? (
        <ErrorState message={currentVisit.errorMessage} onRetry={currentVisit.status === 'Error' ? retry : undefined} />
      ) : null}
      <View style={styles.actions}>
        <PrimaryButton
          label={ScribendCopy.START_RECORDING}
          onPress={startRecording}
          disabled={busy || currentVisit.status === 'Recording' || isProcessing}
        />
        <SecondaryButton
          label={ScribendCopy.STOP_RECORDING}
          onPress={stopAndNavigate}
          disabled={busy || currentVisit.status !== 'Recording'}
        />
        <SecondaryButton label={ScribendCopy.CANCEL_VISIT} onPress={discard} />
      </View>
    </AppScreen>
  );
};

const confirmDiscard = (onConfirm: () => void) => {
  Alert.alert(ScribendCopy.DISCARD_VISIT, '', [
    {text: ScribendCopy.KEEP_VISIT, style: 'cancel'},
    {text: ScribendCopy.CANCEL_VISIT, style: 'destructive', onPress: onConfirm},
  ]);
};

const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  micButton: {
    borderRadius: radius.round,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassStrong,
  },
  patientCard: {
    backgroundColor: colors.glassSubtle,
  },
  patientHeader: {
    gap: spacing.sm,
  },
  patientCopy: {
    gap: spacing.xs,
  },
  condition: {
    alignSelf: 'flex-start',
  },
  timerCard: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
});
