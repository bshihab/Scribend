import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {FileText} from 'lucide-react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {AppHeader, InfoCard, StatusChip} from '../components/HealthcareComponents';
import {EmptyState} from '../components/EmptyState';
import {ScribendCopy} from '../copy/ScribendCopy';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const NotesScreen = ({navigation}: {navigation: any}) => {
  const {savedVisits, openSavedVisit} = useVisitStore();

  return (
    <AppScreen>
      <AppHeader title={ScribendCopy.NOTES} subtitle={ScribendCopy.REVIEW_BAR} />
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
                  navigation.getParent()?.navigate('SoapNote', {visitId: note.id, readOnly: true});
                }
              }}>
              {({pressed}) => (
                <InfoCard title={note.patient.fullName} icon={<FileText size={18} color={colors.greenPrimary} />} style={pressed ? styles.pressed : undefined}>
                  <StatusChip label={note.patient.primaryCondition} tone="green" />
                  <AppText variant="caption">{note.savedAt}</AppText>
                  <AppText numberOfLines={2}>{note.soapNote.assessment || ScribendCopy.NO_ASSESSMENT}</AppText>
                </InfoCard>
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
