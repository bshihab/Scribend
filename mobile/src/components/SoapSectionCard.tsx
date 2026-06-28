import React from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {GlassCard} from './GlassCard';
import {AppText} from './AppText';
import {ScribendCopy} from '../copy/ScribendCopy';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {radius} from '../theme/radius';

interface SoapSectionCardProps {
  label: string;
  icon: React.ReactNode;
  content: string;
  accentColor: string;
  editable: boolean;
  onChangeText: (value: string) => void;
}

export const SoapSectionCard = ({label, icon, content, accentColor, editable, onChangeText}: SoapSectionCardProps) => (
  <GlassCard compact>
    <View style={styles.header}>
      {icon}
      <AppText variant="section" color={accentColor}>
        {label}
      </AppText>
    </View>
    {editable ? (
      <TextInput
        accessibilityLabel={label}
        multiline
        value={content}
        onChangeText={onChangeText}
        placeholder={ScribendCopy.NO_NOTE_GENERATED}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    ) : (
      <AppText color={colors.textPrimary}>{content || ScribendCopy.NO_NOTE_GENERATED}</AppText>
    )}
  </GlassCard>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 88,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 22,
    includeFontPadding: false,
  },
});
