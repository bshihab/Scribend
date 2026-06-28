import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppText} from '../components/AppText';
import {colors} from '../theme/colors';
import {radius} from '../theme/radius';

interface IconProps {
  color?: string;
  size?: number;
}

const GlyphIcon = ({glyph, color = colors.teal, size = 40}: IconProps & {glyph: string}) => (
  <View style={[styles.icon, {width: size, height: size, borderRadius: size / 2, borderColor: color}]}>
    <AppText variant="section" color={color}>
      {glyph}
    </AppText>
  </View>
);

export const ScribendLogoIcon = (props: IconProps) => <GlyphIcon glyph="S" {...props} />;
export const OnDeviceShieldIcon = (props: IconProps) => <GlyphIcon glyph="+" {...props} />;
export const MicrophoneIcon = (props: IconProps) => <GlyphIcon glyph="M" {...props} />;
export const LocalStorageIcon = (props: IconProps) => <GlyphIcon glyph="D" {...props} />;
export const MalePatientIcon = (props: IconProps) => <GlyphIcon glyph="M" {...props} color={props.color ?? colors.primaryBlue} />;
export const FemalePatientIcon = (props: IconProps) => <GlyphIcon glyph="F" {...props} color={props.color ?? colors.teal} />;
export const CheckSuccessIcon = (props: IconProps) => <GlyphIcon glyph="✓" {...props} color={props.color ?? colors.success} />;
export const LockIcon = (props: IconProps) => <GlyphIcon glyph="L" {...props} />;
export const OfflineWifiIcon = (props: IconProps) => <GlyphIcon glyph="O" {...props} />;
export const DatabaseIcon = (props: IconProps) => <GlyphIcon glyph="DB" {...props} />;
export const ClinicianIcon = (props: IconProps) => <GlyphIcon glyph="C" {...props} />;
export const SoapSubjectiveIcon = (props: IconProps) => <GlyphIcon glyph="S" {...props} color={props.color ?? colors.primaryBlue} />;
export const SoapObjectiveIcon = (props: IconProps) => <GlyphIcon glyph="O" {...props} color={props.color ?? colors.teal} />;
export const SoapAssessmentIcon = (props: IconProps) => <GlyphIcon glyph="A" {...props} color={props.color ?? colors.warning} />;
export const SoapPlanIcon = (props: IconProps) => <GlyphIcon glyph="P" {...props} color={props.color ?? colors.cyan} />;

export const PatientAvatarIcon = ({initials, color = colors.primaryBlue}: {initials: string; color?: string}) => (
  <View style={[styles.avatar, {backgroundColor: `${color}28`}]}>
    <AppText variant="section" color={colors.textPrimary}>
      {initials}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
