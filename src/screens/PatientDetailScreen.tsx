import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {ActionPill, InfoCard, MedicationRow, PatientHeaderCard, VitalRow} from '../components/HealthcareComponents';
import {ErrorState} from '../components/ErrorState';
import type {ScribendScreenProps} from '../models/Navigation';
import {usePatientStore} from '../store/PatientStore';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const PatientDetailScreen = ({navigation, route}: ScribendScreenProps<'PatientDetail'>) => {
  const patient = usePatientStore().findPatient(route.params.patientId);
  const {startVisit, prepareSoapDraft} = useVisitStore();
  if (!patient) {
    return <AppScreen><ErrorState message="Patient not found" /></AppScreen>;
  }
  const startRecording = () => {
    startVisit(patient);
    navigation.navigate('VisitInProgress', {patientId: patient.id, gender: patient.gender});
  };
  const generateSoap = () => {
    const visitId = prepareSoapDraft(patient);
    navigation.navigate('SoapNote', {visitId});
  };
  const openHistory = () => navigation.navigate('HomeTabs', {screen: 'PatientHistory'});
  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PatientHeaderCard patient={patient} onBack={() => navigation.navigate('HomeTabs', {screen: 'Patients'})} />
      <View style={styles.actionStrip}>
        <ActionPill label="Start Recording" symbol="●" onPress={startRecording} />
        <ActionPill label="Generate SOAP" symbol="S" onPress={generateSoap} />
        <ActionPill label="Patient History" symbol="H" onPress={openHistory} />
      </View>
      <InfoCard title="Recent Note" symbol="+"><AppText color={colors.textPrimary}>{patient.recentNotes[0]?.preview ?? patient.notePreview}</AppText></InfoCard>
      <InfoCard title="Vitals" symbol="♥">{patient.vitals.map(vital => <VitalRow key={vital.label} vital={vital} />)}</InfoCard>
      <InfoCard title="Medications" symbol="Rx">{patient.medications.map(medication => <MedicationRow key={`${medication.name}-${medication.dosage}`} medication={medication} />)}</InfoCard>
      <InfoCard title="SOAP Draft" symbol="S" footer="Generate SOAP" onFooterPress={generateSoap}>
        <View style={styles.soapPreview}>
          <AppText variant="caption" color={colors.greenPrimary}>Subjective</AppText><AppText>{patient.notePreview}</AppText>
          <AppText variant="caption" color={colors.greenPrimary}>Objective</AppText><AppText>{patient.vitals.map(vital => `${vital.label} ${vital.value}${vital.unit ? ` ${vital.unit}` : ''}`).join(' • ')}</AppText>
          <AppText variant="caption" color={colors.greenPrimary}>Assessment</AppText><AppText>{patient.primaryCondition}</AppText>
          <AppText variant="caption" color={colors.greenPrimary}>Plan</AppText><AppText>Continue current plan and follow up in 3 months.</AppText>
        </View>
      </InfoCard>
    </AppScreen>
  );
};

const styles = StyleSheet.create({screenContent: {paddingBottom: 120}, actionStrip: {flexDirection: 'row', gap: spacing.sm}, soapPreview: {gap: spacing.xs}});