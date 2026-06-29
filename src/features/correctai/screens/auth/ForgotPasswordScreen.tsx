import { StyleSheet, View } from 'react-native';

import {
  AuthFrame,
  BrandTitle,
  Field,
  Icons,
  PrimaryButton,
  TextButton,
} from '@/features/correctai/components/ui';
import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, UserRole } from '@/features/correctai/types';

type AuthProps = {
  onLogin: (role: UserRole) => void;
  onNavigate: (screen: AppScreen) => void;
};

export function ForgotPasswordScreen({ onNavigate }: AuthProps) {
  return (
    <AuthFrame>
      <View style={styles.form}>
        <BrandTitle subtitle="Entrez votre email pour recevoir le lien" />
        <Field autoCapitalize="none" keyboardType="email-address" placeholder="Votre email" />
        <PrimaryButton icon={Icons.mail} onPress={() => onNavigate('login')}>
          Envoyer le lien
        </PrimaryButton>
        <TextButton icon={Icons.back} onPress={() => onNavigate('login')}>
          Se connecter
        </TextButton>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: correctAiTheme.spacing.md,
  },
});
