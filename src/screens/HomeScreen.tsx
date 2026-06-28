import React from 'react';
import {Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {IconBadge} from '../components/IconBadge';
import {NavigationButton} from '../components/NavigationButton';
import {PatientAvatar, StatusChip} from '../components/HealthcareComponents';
import {doctorImages} from '../assets/images';
import type {ScribendTabScreenProps} from '../models/Navigation';
import {usePatientStore} from '../store/PatientStore';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {shadows} from '../theme/shadows';
import {spacing} from '../theme/spacing';

export const HomeScreen = ({navigation}: ScribendTabScreenProps<'HomeDashboard'>) => {
  const {patients} = usePatientStore();
  const {startVisit} = useVisitStore();
  const {width} = useWindowDimensions();
  const margaret = patients.find(patient => patient.id === 'margaret') ?? patients[0];
  const james = patients.find(patient => patient.id === 'james') ?? patients[1];
  const columns = width >= 430 ? 3 : 2;
  const cardWidth = Math.floor((width - spacing.screen * 2 - spacing.md * (columns - 1)) / columns);
  const openPatients = () => navigation.navigate('Patients');
  const openPatient = (patientId: string) => navigation.getParent()?.navigate('PatientDetail', {patientId});
  const recordNote = () => {
    if (!margaret) return openPatients();
    startVisit(margaret);
    navigation.getParent()?.navigate('VisitInProgress', {patientId: margaret.id, gender: margaret.gender});
  };

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.flex}><AppText variant="caption">Good morning,</AppText><AppText variant="headline" color={colors.textPrimary}>Dr. Maya</AppText></View>
        <PatientAvatar initials="DM" source={doctorImages.maya} size={64} showOnline />
      </View>
      <View style={styles.visitCard}>
        <View style={styles.visitTopRow}><View><AppText variant="section" color={colors.white}>Today's Visits</AppText><AppText variant="display" color={colors.white} style={styles.visitNumber}>8</AppText><AppText color="rgba(255,255,255,0.82)">2 follow-ups • 6 consults</AppText></View><View style={styles.visitChip}><AppText variant="caption" color={colors.plum}>+15% vs yesterday</AppText></View></View>
        <View style={styles.barRow}>{[58, 96, 72, 128, 86, 112].map((height, index) => <View key={index} style={[styles.bar, {height}]} />)}</View>
      </View>
      <View style={styles.actionsGrid}><ActionBox width={cardWidth} symbol="▶" title="Start Visit" subtitle="Choose a patient" onPress={openPatients} /><ActionBox width={cardWidth} symbol="✎" title="Record Note" subtitle="Start with Margaret" onPress={recordNote} /><ActionBox width={cardWidth} symbol="P" title="View Patients" subtitle="Open patient history" onPress={openPatients} /></View>
      <View style={styles.scribeCard}><IconBadge symbol="✦" /><View style={styles.flex}><AppText variant="section" color={colors.textPrimary}>AI Scribe Ready</AppText><AppText>Listening for your next visit</AppText></View><StatusChip label="Connected" tone="green" /></View>
      <View style={styles.sectionHeader}><AppText variant="section" color={colors.textPrimary}>Upcoming Appointments</AppText><NavigationButton label="View Patients" onPress={openPatients} variant="ghost" style={styles.smallButton} /></View>
      <View style={styles.appointmentList}>{margaret ? <Appointment name="Margaret Thompson" detail="10:00 AM • Follow-up" status="Confirmed" onPress={() => openPatient(margaret.id)} /> : null}{james ? <Appointment name="James Anderson" detail="11:30 AM • Check-up" status="Pending" onPress={() => openPatient(james.id)} /> : null}</View>
    </AppScreen>
  );
};

const ActionBox = ({width, symbol, title, subtitle, onPress}: {width: number; symbol: string; title: string; subtitle: string; onPress: () => void}) => <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed}) => [styles.actionBox, {width}, pressed && styles.pressed]}><IconBadge symbol={symbol} size={56} /><AppText variant="title" color={colors.textPrimary}>{title}</AppText><AppText>{subtitle}</AppText></Pressable>;
const Appointment = ({name, detail, status, onPress}: {name: string; detail: string; status: string; onPress: () => void}) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${name}`} onPress={onPress} style={({pressed}) => [styles.appointment, pressed && styles.pressed]}><IconBadge symbol="●" size={42} backgroundColor={status === 'Confirmed' ? colors.softGreen : '#FFF4D8'} color={status === 'Confirmed' ? colors.darkGreen : colors.warning} /><View style={styles.flex}><AppText variant="button" color={colors.textPrimary}>{name}</AppText><AppText variant="caption">{detail}</AppText></View><StatusChip label={status} tone={status === 'Confirmed' ? 'green' : 'warning'} /></Pressable>;

const styles = StyleSheet.create({
  screenContent: {paddingBottom: 120}, flex: {flex: 1, gap: spacing.xs}, header: {minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md}, visitCard: {minHeight: 190, justifyContent: 'space-between', borderRadius: 28, backgroundColor: colors.plum, padding: spacing.xl, ...(shadows.glow as object)}, visitTopRow: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md}, visitNumber: {fontSize: 56, lineHeight: 64}, visitChip: {height: 34, justifyContent: 'center', borderRadius: radius.round, backgroundColor: colors.white, paddingHorizontal: spacing.md}, barRow: {height: 132, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm}, bar: {flex: 1, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: 'rgba(255,255,255,0.42)'}, actionsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md}, actionBox: {minHeight: 150, gap: spacing.md, justifyContent: 'center', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 20, ...(shadows.glass as object)}, scribeCard: {minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, ...(shadows.glass as object)}, sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm}, smallButton: {minHeight: 48, paddingHorizontal: spacing.md}, appointmentList: {gap: spacing.sm}, appointment: {minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, ...(shadows.glass as object)}, pressed: {opacity: 0.82, transform: [{scale: 0.99}]},
});