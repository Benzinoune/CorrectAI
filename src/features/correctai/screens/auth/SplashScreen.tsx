import { useCallback, useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import type { AppScreen, UserRole } from '@/features/correctai/types';

type AuthProps = {
  onLogin: (role: UserRole) => void;
  onNavigate: (screen: AppScreen) => void;
};

export function SplashScreen({ onNavigate }: AuthProps) {
  const continueToLogin = useCallback(() => onNavigate('login'), [onNavigate]);

  useEffect(() => {
    console.log('[Splash] mounted');
    const timer = setTimeout(() => {
      console.log('[Splash] auto-redirecting to login');
      continueToLogin();
    }, 3000);

    return () => clearTimeout(timer);
  }, [continueToLogin]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Image
          accessibilityLabel="CorrectAI logo"
          resizeMode="contain"
          source={require('../../../../../assets/images/correctai-splash-logo.png')}
          style={styles.logo}
        />
        <Text style={styles.tagline}>Correction intelligente, résultat instantané</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: 18,
  },
  tagline: {
    color: '#7A8090',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
