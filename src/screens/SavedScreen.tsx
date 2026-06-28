import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {GlassCard} from '../components/GlassCard';
import {PrimaryButton} from '../components/PrimaryButton';
import {SecondaryButton} from '../components/SecondaryButton';
import {ScribendCopy} from '../copy/ScribendCopy';
import {IconBadge} from '../components/IconBadge';
import type {ScribendScreenProps} from '../models/Navigation';
import {genderLabel} from '../models/Patient';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const SavedScreen = ({navigation, route}: ScribendScreenProps<'Saved'>) => {
  const {visitId} = route.params;
  const {currentVisit, openSavedVisit, clearCurrentVisit} = useVisitStore();

  useEffect(() => {
    if (currentVisit.id !== visitId && !openSavedVisit(visitId)) {
      navigation.replace('Home');
    }
  }, [currentVisit.id, navigation, openSavedVisit, visitId]);

  return (
    <AppScreen>
      <View style={styles.success}>
        <IconBadge symbol="✓" size={68} />
      </View>
      <AppText variant="headline" color={colors.textPrimary}>
        {ScribendCopy.SAVED_SUCCESS_TITLE}
      </AppText>
      <AppText>{ScribendCopy.SAVED_SUCCESS_DESC}</AppText>
      {currentVisit.patient ? (
        <GlassCard compact style={styles.patientCard}>
          <AppText variant="section" color={colors.textPrimary}>
            {currentVisit.patient.fullName}
          </AppText>
          <AppText>
            {currentVisit.patient.age} y • {genderLabel(currentVisit.patient.gender)}
          </AppText>
          <AppText color={colors.textPrimary}>{currentVisit.patient.primaryCondition}</AppText>
        </GlassCard>
      ) : null}
      <PrimaryButton label={ScribendCopy.VIEW_NOTE} onPress={() => navigation.navigate('SoapNote', {visitId, readOnly: true})} />
      <SecondaryButton
        label={ScribendCopy.START_NEW_VISIT}
        onPress={() => {
          clearCurrentVisit();
          navigation.navigate('Home');
        }}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  success: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  patientCard: {
    gap: spacing.xs,
  },
});
