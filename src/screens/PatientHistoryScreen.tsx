import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {FilterChip, PatientHistoryCard, SearchInput} from '../components/HealthcareComponents';
import {NavigationButton} from '../components/NavigationButton';
import type {Patient} from '../models/Patient';
import {usePatientStore} from '../store/PatientStore';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const PatientHistoryScreen = ({navigation}: {navigation: any}) => {
  const {patients} = usePatientStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Chronic'>('All');
  const visiblePatients = useMemo(() => patients.filter(patient => matches(patient, query, filter)), [filter, patients, query]);
  const openPatient = (patientId: string) => navigation.getParent()?.navigate('PatientDetail', {patientId});
  return <AppScreen contentStyle={styles.screenContent}><View style={styles.headerRow}><AppText variant="headline" color={colors.textPrimary}>Patient History</AppText><NavigationButton label="+ New Patient" onPress={() => Alert.alert('Demo mode', 'New patient intake is disabled for this lightweight demo.')} variant="primary" style={styles.newPatient} /></View><SearchInput value={query} onChangeText={setQuery} placeholder="Search patients" /><View style={styles.filterRow}><FilterChip label="All" selected={filter === 'All'} onPress={() => setFilter('All')} /><FilterChip label="Chronic" selected={filter === 'Chronic'} onPress={() => setFilter('Chronic')} /></View><View style={styles.list}>{visiblePatients.map(patient => <PatientHistoryCard key={patient.id} patient={patient} onPress={() => openPatient(patient.id)} />)}</View></AppScreen>;
};

const matches = (patient: Patient, query: string, filter: 'All' | 'Chronic') => {
  const term = query.trim().toLowerCase();
  return (!term || patient.fullName.toLowerCase().includes(term) || patient.primaryCondition.toLowerCase().includes(term)) && (filter === 'All' || ['Hypertension', 'Type 2 Diabetes'].includes(patient.primaryCondition));
};

const styles = StyleSheet.create({screenContent: {paddingBottom: 120}, headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md}, newPatient: {minWidth: 142}, filterRow: {flexDirection: 'row', gap: spacing.sm}, list: {gap: spacing.md}});