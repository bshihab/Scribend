import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {AppTopBar} from '../components/AppTopBar';
import {EmptyState} from '../components/EmptyState';
import {GlassCard} from '../components/GlassCard';
import {ScribendCopy} from '../copy/ScribendCopy';
import type {ScribendScreenProps} from '../models/Navigation';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const PatientHistoryScreen = ({navigation}: ScribendScreenProps<'PatientHistory'>) => {
  const {savedVisits, openSavedVisit} = useVisitStore();

  return (
    <AppScreen>
      <AppTopBar title={ScribendCopy.PATIENT_HISTORY} onBack={() => navigation.navigate('Home')} />
      {savedVisits.length === 0 ? (
        <EmptyState message={ScribendCopy.NO_SAVED_NOTES} />
      ) : (
        <View style={styles.list}>
          {savedVisits.map(note => (
            <Pressable
              key={note.id}
              accessibilityRole="button"
              accessibilityLabel={note.patient.fullName}
              onPress={() => {
                if (openSavedVisit(note.id)) {
                  navigation.navigate('SoapNote', {visitId: note.id, readOnly: true});
                }
              }}>
              {({pressed}) => (
                <GlassCard compact style={pressed && styles.pressed}>
                  <AppText variant="section" color={colors.textPrimary}>
                    {note.patient.fullName}
                  </AppText>
                  <AppText>{note.savedAt}</AppText>
                  <AppText color={colors.textPrimary}>{note.patient.primaryCondition}</AppText>
                  <AppText>{note.soapNote.assessment || ScribendCopy.NO_ASSESSMENT}</AppText>
                </GlassCard>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.82,
  },
});
