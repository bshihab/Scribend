import React, {useState} from 'react';
import {Linking, PermissionsAndroid, Platform, StyleSheet, View} from 'react-native';
import {AppScreen} from '../components/AppScreen';
import {AppText} from '../components/AppText';
import {ErrorState} from '../components/ErrorState';
import {PermissionCard} from '../components/PermissionCard';
import {PrimaryButton} from '../components/PrimaryButton';
import {SecondaryButton} from '../components/SecondaryButton';
import {ScribendCopy} from '../copy/ScribendCopy';
import {LocalStorageIcon, MicrophoneIcon} from '../icons/ScribendIcons';
import type {ScribendScreenProps} from '../models/Navigation';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

type PermissionStatus = 'Required' | 'Granted' | 'Denied';

export const PermissionsScreen = ({navigation}: ScribendScreenProps<'Permissions'>) => {
  const [microphoneStatus, setMicrophoneStatus] = useState<PermissionStatus>('Required');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') {
      navigation.navigate('HomeTabs');
      return;
    }

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      setMicrophoneStatus('Granted');
      setErrorMessage(undefined);
      navigation.navigate('HomeTabs');
    } else {
      setMicrophoneStatus('Denied');
      setErrorMessage(ScribendCopy.PERMISSION_ERROR);
    }
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="headline" color={colors.textPrimary}>
          {ScribendCopy.PERMISSIONS_TITLE}
        </AppText>
        <AppText>{ScribendCopy.PERMISSIONS_DESC}</AppText>
      </View>
      <PermissionCard
        title={ScribendCopy.MICROPHONE_ACCESS}
        description={ScribendCopy.MICROPHONE_DESC}
        status={microphoneStatus}
        icon={<MicrophoneIcon />}
      />
      <PermissionCard
        title={ScribendCopy.LOCAL_STORAGE_ACCESS}
        description={ScribendCopy.LOCAL_STORAGE_DESC}
        status={ScribendCopy.GRANTED}
        icon={<LocalStorageIcon />}
      />
      {errorMessage ? <ErrorState message={errorMessage} /> : null}
      <PrimaryButton label={ScribendCopy.CONTINUE} onPress={requestPermissions} />
      <SecondaryButton label={ScribendCopy.OPEN_SETTINGS} onPress={() => Linking.openSettings()} />
      {errorMessage ? (
        <SecondaryButton label={ScribendCopy.CONTINUE} onPress={() => navigation.navigate('HomeTabs')} />
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
});
