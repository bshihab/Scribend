import React from 'react';
import {ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {GlassPanel} from './GlassPanel';
import {spacing} from '../theme/spacing';

interface AppScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export const AppScreen = ({children, scroll = true, contentStyle}: AppScreenProps) => {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = width >= 430 ? spacing.screenWide : width <= 360 ? spacing.screenCompact : spacing.screen;
  const bottomPadding = Math.max(spacing.bottomSafe, insets.bottom + spacing.xxl);
  const responsiveContentStyle = [
    styles.content,
    {
      paddingHorizontal: horizontalPadding,
      paddingTop: spacing.lg,
      paddingBottom: bottomPadding,
    },
    contentStyle,
  ];

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={responsiveContentStyle}>
      {children}
    </ScrollView>
  ) : (
    <View style={responsiveContentStyle}>{children}</View>
  );

  return (
    <GlassPanel>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {content}
      </SafeAreaView>
    </GlassPanel>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
});
