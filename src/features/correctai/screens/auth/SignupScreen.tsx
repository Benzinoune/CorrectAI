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

export function SignupScreen({ onNavigate }: AuthProps) {
  return (
    <AuthFrame>
      <BrandTitle subtitle="Creer un compte professeur" />
      <View style={styles.form}>
        <Field placeholder="Nom" />
        <Field placeholder="Prenom" />
        <Field autoCapitalize="none" keyboardType="email-address" placeholder="Email" />
        <Field placeholder="Mot de passe" secureTextEntry />
        <PrimaryButton icon={Icons.check} onPress={() => onNavigate('login')}>
          Creer
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
