import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {ScribendCopy} from '../copy/ScribendCopy';

export const AppTopBar = ({title, onBack}: {title: string; onBack?: () => void}) => (
  <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={ScribendCopy.BACK} onPress={onBack} style={styles.back}>
      {onBack ? (
        <AppText variant="title" color={colors.textPrimary}>
          {'<'}
        </AppText>
      ) : null}
    </Pressable>
    <AppText variant="section" color={colors.textPrimary}>
      {title}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  back: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
