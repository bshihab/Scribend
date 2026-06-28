import React, {useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppTopBar} from '../components/AppTopBar';
import {ErrorState} from '../components/ErrorState';
import {PrimaryButton} from '../components/PrimaryButton';
import {ScribendCopy} from '../copy/ScribendCopy';
import type {ScribendScreenProps} from '../models/Navigation';
import {genderLabel} from '../models/Patient';
import {usePatientStore} from '../store/PatientStore';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';
import {spacing} from '../theme/spacing';

export const AddNewPatientScreen = ({navigation, route}: ScribendScreenProps<'AddNewPatient'>) => {
  const {gender} = route.params;
  const {addPatient} = usePatientStore();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [primaryCondition, setPrimaryCondition] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const save = () => {
    const result = addPatient({fullName, age, gender, primaryCondition, currentMedications, allergies});
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    navigation.navigate('SelectPatient', {gender});
  };

  return (
    <AppScreen>
      <AppTopBar title={ScribendCopy.ADD_NEW_PATIENT} onBack={() => navigation.navigate('SelectPatient', {gender})} />
      <View style={styles.form}>
        <Field label={ScribendCopy.FULL_NAME} value={fullName} onChangeText={setFullName} />
        <Field label={ScribendCopy.AGE} value={age} onChangeText={setAge} keyboardType="number-pad" />
        <Field label={ScribendCopy.GENDER} value={genderLabel(gender)} onChangeText={() => undefined} editable={false} />
        <Field label={ScribendCopy.PRIMARY_CONDITION} value={primaryCondition} onChangeText={setPrimaryCondition} />
        <Field label={ScribendCopy.CURRENT_MEDICATIONS} value={currentMedications} onChangeText={setCurrentMedications} multiline />
        <Field label={ScribendCopy.ALLERGIES} value={allergies} onChangeText={setAllergies} multiline />
      </View>
      {errorMessage ? <ErrorState message={errorMessage} /> : null}
      <PrimaryButton label={ScribendCopy.SAVE_PATIENT} onPress={save} />
    </AppScreen>
  );
};

type FieldProps = React.ComponentProps<typeof TextInput> & {label: string};

const Field = ({label, style, ...props}: FieldProps) => (
  <TextInput
    accessibilityLabel={label}
    placeholder={label}
    placeholderTextColor={colors.textMuted}
    style={[styles.input, props.multiline && styles.multiline, style]}
    {...props}
  />
);

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  input: {
    minHeight: spacing.touchTarget,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glass,
    fontSize: 15,
    lineHeight: 20,
    includeFontPadding: false,
  },
  multiline: {
    minHeight: 82,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
});
