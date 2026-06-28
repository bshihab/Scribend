import React from 'react';
import {Image, ImageSourcePropType, Pressable, StyleSheet, TextInput, View, ViewStyle} from 'react-native';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {AppText} from './AppText';
import {IconBadge} from './IconBadge';
import {NavigationButton} from './NavigationButton';
import {patientImages} from '../assets/images';
import type {Patient, PatientMedication, PatientVital} from '../models/Patient';
import {genderLabel, patientInitials} from '../models/Patient';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {shadows} from '../theme/shadows';
import {spacing} from '../theme/spacing';

export const AppHeader = ({
  eyebrow,
  title,
  subtitle,
  right,
  onBack,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  onMore?: () => void;
}) => (
  <View style={styles.appHeader}>
    {onBack ? <NavigationButton label="Back" direction="back" onPress={onBack} variant="secondary" style={styles.headerBackButton} /> : null}
    <View style={styles.flex}>
      {eyebrow ? <AppText variant="caption">{eyebrow}</AppText> : null}
      <AppText variant="headline" color={colors.textPrimary}>{title}</AppText>
      {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
    </View>
    {right}
  </View>
);

export const patientAvatarSource = (patient?: Patient): ImageSourcePropType | undefined => {
  if (patient?.id === 'margaret') return patientImages.margaret;
  if (patient?.id === 'james') return patientImages.james;
  return undefined;
};

export const PatientAvatar = ({patient, initials, source, size = 56, showOnline = false}: {patient?: Patient; initials?: string; source?: ImageSourcePropType; size?: number; showOnline?: boolean}) => {
  const label = initials ?? (patient ? patientInitials(patient) : 'DM');
  return (
    <View style={[styles.avatar, {width: size, height: size, borderRadius: size / 2}]}>
      {source ? <Image source={source} resizeMode="cover" style={styles.avatarImage} /> : <AppText variant="button" color={colors.darkGreen}>{label}</AppText>}
      {showOnline ? <View style={styles.onlineDot} /> : null}
    </View>
  );
};

export const StatusChip = ({label, tone = 'neutral'}: {label: string; tone?: 'green' | 'plum' | 'neutral' | 'warning'}) => (
  <View style={[styles.chip, chipTone[tone]]}><AppText variant="caption" color={chipTextTone[tone]}>{label}</AppText></View>
);

export const SearchInput = ({value, onChangeText, placeholder}: {value: string; onChangeText: (value: string) => void; placeholder: string}) => (
  <View style={styles.searchBox}>
    <IconBadge symbol="⌕" size={34} backgroundColor={colors.surfaceMuted} color={colors.textSecondary} />
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textMuted} style={styles.searchInput} accessibilityLabel={placeholder} />
  </View>
);

export const FilterChip = ({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) => (
  <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={[styles.filterChip, selected && styles.filterChipSelected]}>
    <AppText variant="button" color={selected ? colors.darkGreen : colors.textSecondary}>{label}</AppText>
  </Pressable>
);

export const PatientHistoryCard = ({patient, onPress}: {patient: Patient; onPress: () => void}) => (
  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${patient.fullName}`} onPress={onPress} style={({pressed}) => [styles.patientCard, pressed && styles.pressed]}>
    <View style={styles.patientCardTop}>
      <PatientAvatar patient={patient} source={patientAvatarSource(patient)} size={72} />
      <View style={styles.flex}>
        <AppText variant="title" color={colors.textPrimary}>{patient.fullName}</AppText>
        <AppText variant="caption">{patient.age} years • {genderLabel(patient.gender)}</AppText>
        <StatusChip label={patient.primaryCondition} tone="green" />
      </View>
    </View>
    <AppText variant="caption" color={colors.textSecondary}>Last visit: {patient.lastVisitDate}</AppText>
    <AppText color={colors.textSecondary} numberOfLines={3}>{patient.notePreview}</AppText>
    <NavigationButton label="Open Profile" direction="next" onPress={onPress} variant="secondary" />
  </Pressable>
);

export const PatientHeaderCard = ({patient, onBack}: {patient: Patient; onBack: () => void; onMore?: () => void}) => (
  <View style={styles.patientHeaderCard}>
    <NavigationButton label="Back" direction="back" onPress={onBack} variant="secondary" style={styles.backButton} />
    <View style={styles.patientHeaderMain}>
      <PatientAvatar patient={patient} source={patientAvatarSource(patient)} size={88} />
      <View style={styles.flex}>
        <AppText variant="headline" color={colors.textPrimary}>{patient.fullName}</AppText>
        <StatusChip label={patient.primaryCondition} tone="green" />
        <AppText variant="caption" color={colors.textSecondary}>{patient.age} years • {genderLabel(patient.gender)} • MRN: {patient.mrn}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>Last visit: {patient.lastVisitDate}</AppText>
      </View>
    </View>
  </View>
);

export const ActionPill = ({label, symbol = '+', onPress}: {label: string; symbol?: string; icon?: React.ReactNode; onPress: () => void}) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed}) => [styles.actionPill, pressed && styles.pressed]}>
    <IconBadge symbol={symbol} size={42} />
    <AppText variant="button" color={colors.textPrimary} style={styles.centerText}>{label}</AppText>
  </Pressable>
);

export const InfoCard = ({title, symbol = '+', children, footer, onFooterPress, style}: {title: string; symbol?: string; icon?: React.ReactNode; children: React.ReactNode; footer?: string; onFooterPress?: () => void; style?: ViewStyle}) => (
  <View style={[styles.infoCard, style]}>
    <View style={styles.infoHeader}><IconBadge symbol={symbol} size={42} backgroundColor={colors.surfaceMuted} /><AppText variant="section" color={colors.textPrimary}>{title}</AppText></View>
    <View style={styles.infoBody}>{children}</View>
    {footer ? <NavigationButton label={footer} direction="next" onPress={onFooterPress ?? (() => undefined)} variant="ghost" /> : null}
  </View>
);

export const VitalRow = ({vital}: {vital: PatientVital}) => <View style={styles.rowItem}><AppText variant="button" color={colors.textPrimary}>{vital.label}</AppText><AppText color={colors.textSecondary}>{vital.value}{vital.unit ? ` ${vital.unit}` : ''}</AppText></View>;
export const MedicationRow = ({medication}: {medication: PatientMedication}) => <View style={styles.rowItem}><AppText variant="button" color={colors.textPrimary}>{medication.name}</AppText><AppText color={colors.textSecondary}>{medication.dosage} • {medication.schedule}</AppText></View>;
export const TimelineItem = ({date, title, description}: {date: string; title: string; description: string}) => <View style={styles.timelineItem}><AppText variant="caption">{date}</AppText><AppText variant="button" color={colors.textPrimary}>{title}</AppText><AppText>{description}</AppText></View>;

const tabSymbol = (routeName: string) => (routeName === 'HomeDashboard' ? '●' : routeName === 'Patients' ? 'P' : routeName === 'PatientHistory' ? 'H' : 'S');
const tabLabel = (routeName: string) => (routeName === 'HomeDashboard' ? 'Home' : routeName === 'PatientHistory' ? 'History' : routeName);

export const BottomTabBar = ({state, descriptors, navigation}: BottomTabBarProps) => (
  <View pointerEvents="box-none" style={styles.tabBarWrapper}>
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = typeof descriptors[route.key]?.options?.title === 'string' ? descriptors[route.key].options.title : tabLabel(route.name);
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{selected: focused}} onPress={() => navigation.navigate(route.name)} style={[styles.tabItem, focused && styles.tabItemActive]}><IconBadge symbol={tabSymbol(route.name)} size={32} backgroundColor={focused ? colors.softGreen : colors.surfaceMuted} color={focused ? colors.darkGreen : colors.textSecondary} /><AppText variant="caption" color={focused ? colors.darkGreen : colors.textSecondary} numberOfLines={1}>{label}</AppText></Pressable>;
      })}
    </View>
  </View>
);

const chipTone = StyleSheet.create({green: {backgroundColor: colors.softGreen, borderColor: colors.greenPrimary}, plum: {backgroundColor: colors.plumSoft, borderColor: colors.plum}, neutral: {backgroundColor: colors.surfaceMuted, borderColor: colors.border}, warning: {backgroundColor: '#FFF4D8', borderColor: colors.warning}});
const chipTextTone = {green: colors.darkGreen, plum: colors.plum, neutral: colors.textSecondary, warning: colors.warning};

const styles = StyleSheet.create({
  appHeader: {minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md}, headerBackButton: {minHeight: 48}, flex: {flex: 1, gap: spacing.xs}, avatar: {overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softGreen, borderWidth: 1, borderColor: colors.buttonStroke}, avatarImage: {...StyleSheet.absoluteFillObject, width: '100%', height: '100%'}, onlineDot: {position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.greenPrimary, borderWidth: 2, borderColor: colors.white},
  chip: {alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', borderRadius: radius.round, borderWidth: 1, paddingHorizontal: 12}, searchBox: {minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.buttonStroke, backgroundColor: colors.surface, paddingHorizontal: spacing.md, ...(shadows.glass as object)}, searchInput: {flex: 1, minHeight: 56, color: colors.textPrimary, fontSize: 16},
  filterChip: {minHeight: 48, justifyContent: 'center', borderRadius: radius.round, borderWidth: 1, borderColor: colors.buttonStroke, backgroundColor: colors.surface, paddingHorizontal: spacing.xl}, filterChipSelected: {backgroundColor: colors.softGreen, borderColor: colors.greenPrimary},
  patientCard: {gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, ...(shadows.glass as object)}, patientCardTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  patientHeaderCard: {gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, ...(shadows.glass as object)}, backButton: {alignSelf: 'flex-start'}, patientHeaderMain: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  actionPill: {flex: 1, minHeight: 104, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.buttonStroke, backgroundColor: colors.surface, padding: spacing.md, ...(shadows.glass as object)}, centerText: {textAlign: 'center'},
  infoCard: {gap: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, ...(shadows.glass as object)}, infoHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm}, infoBody: {gap: spacing.sm}, rowItem: {minHeight: 52, justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, gap: spacing.xs}, timelineItem: {gap: spacing.xs, paddingVertical: spacing.sm},
  tabBarWrapper: {position: 'absolute', left: 0, right: 0, bottom: 18, alignItems: 'center'}, tabBar: {width: '90%', minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm, ...(shadows.glow as object)}, tabItem: {flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 22}, tabItemActive: {backgroundColor: colors.softGreen}, pressed: {opacity: 0.82, transform: [{scale: 0.99}]},
});