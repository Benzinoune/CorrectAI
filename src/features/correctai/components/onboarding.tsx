import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { correctAiTheme, phoneMaxWidth } from '@/features/correctai/theme';

const { colors, spacing } = correctAiTheme;

export function OnboardingFrame({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.viewport}>
      <StatusBar style="dark" />
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={styles.phone}>
        <View
          style={[
            styles.safeContent,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, spacing.xl),
            },
          ]}>
          {children}
        </View>
      </Pressable>
    </View>
  );
}

export function SplashBrand({
  subtitle,
  title = 'CorrectAI',
}: {
  subtitle: string;
  title?: string;
}) {
  return (
    <View style={styles.brandBlock}>
      <Image
        accessibilityLabel={`${title} logo`}
        resizeMode="contain"
        source={require('../../../../assets/images/correctai-splash-logo.png')}
        style={styles.logoImage}
      />
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function OnboardingDots({
  count = 3,
  activeIndex = 0,
}: {
  count?: number;
  activeIndex?: number;
}) {
  return (
    <View accessibilityRole="progressbar" style={styles.dots}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    backgroundColor: '#DDE1EA',
    alignItems: 'center',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: phoneMaxWidth,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  safeContent: {
    flex: 1,
  },
  brandBlock: {
    alignItems: 'center',
  },
  logoImage: {
    width: 260,
    height: 260,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 18,
    marginTop: spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: colors.card,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
});
