import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppTopBar} from '../components/AppTopBar';
import {ErrorState} from '../components/ErrorState';
import {PrimaryButton} from '../components/PrimaryButton';
import {RetrievedContextCard} from '../components/RetrievedContextCard';
import {SecondaryButton} from '../components/SecondaryButton';
import {SoapSectionCard} from '../components/SoapSectionCard';
import {StatusBadge} from '../components/StatusBadge';
import {ScribendCopy} from '../copy/ScribendCopy';
import {IconBadge} from '../components/IconBadge';
import type {ScribendScreenProps} from '../models/Navigation';
import {fallbackSoapNote} from '../models/SoapNote';
import {useVisitStore} from '../store/VisitStore';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const SoapNoteScreen = ({navigation, route}: ScribendScreenProps<'SoapNote'>) => {
  const {visitId, readOnly} = route.params;
  const {currentVisit, updateSoapNote, saveCurrentNote, isCurrentVisitSaved, openSavedVisit, clearCurrentVisit} = useVisitStore();
  const [editable, setEditable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (currentVisit.id !== visitId && !openSavedVisit(visitId)) {
      navigation.replace('Home');
    }
  }, [currentVisit.id, navigation, openSavedVisit, visitId]);

  const note = useMemo(() => currentVisit.soapNote ?? fallbackSoapNote(), [currentVisit.soapNote]);
  const saved = isCurrentVisitSaved();
  const locked = Boolean(readOnly || currentVisit.readOnly);

  const save = () => {
    const result = saveCurrentNote();
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    navigation.navigate('Saved', {visitId: result.visitId});
  };

  return (
    <AppScreen>
      <AppTopBar title={ScribendCopy.SOAP_NOTE} onBack={() => navigation.goBack()} />
      <StatusBadge label={locked ? ScribendCopy.READ_ONLY : ScribendCopy.REVIEW_BAR} color={colors.cyan} />
      {!currentVisit.soapNote ? <ErrorState message={ScribendCopy.NO_NOTE_GENERATED} /> : null}
      <RetrievedContextCard context={currentVisit.retrievedContext?.summary} />
      <SoapSectionCard
        label={ScribendCopy.SUBJECTIVE}
        icon={<IconBadge symbol="S" size={36} />}
        content={note.subjective}
        accentColor={colors.primaryBlue}
        editable={editable && !locked}
        onChangeText={subjective => updateSoapNote({...note, subjective})}
      />
      <SoapSectionCard
        label={ScribendCopy.OBJECTIVE}
        icon={<IconBadge symbol="O" size={36} />}
        content={note.objective}
        accentColor={colors.teal}
        editable={editable && !locked}
        onChangeText={objective => updateSoapNote({...note, objective})}
      />
      <SoapSectionCard
        label={ScribendCopy.ASSESSMENT}
        icon={<IconBadge symbol="A" size={36} />}
        content={note.assessment}
        accentColor={colors.warning}
        editable={editable && !locked}
        onChangeText={assessment => updateSoapNote({...note, assessment})}
      />
      <SoapSectionCard
        label={ScribendCopy.PLAN}
        icon={<IconBadge symbol="P" size={36} />}
        content={note.plan}
        accentColor={colors.cyan}
        editable={editable && !locked}
        onChangeText={plan => updateSoapNote({...note, plan})}
      />
      {errorMessage ? <ErrorState message={errorMessage} /> : null}
      <View style={styles.actions}>
        <PrimaryButton label={saved ? ScribendCopy.ALREADY_SAVED : ScribendCopy.SAVE_NOTE_LOCALLY} onPress={save} disabled={saved || locked} />
        <SecondaryButton label={ScribendCopy.EDIT_NOTE} onPress={() => setEditable(true)} disabled={locked} />
        <SecondaryButton
          label={ScribendCopy.START_NEW_VISIT}
          onPress={() => {
            clearCurrentVisit();
            navigation.navigate('Home');
          }}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
});
