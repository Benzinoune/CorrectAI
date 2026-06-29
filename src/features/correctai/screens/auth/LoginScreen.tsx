import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AuthFrame,
  BrandTitle,
  Field,
  Icons,
  PrimaryButton,
  RoleSwitch,
  TextButton,
} from '@/features/correctai/components/ui';
import { admins } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, UserRole } from '@/features/correctai/types';

type AuthProps = {
  onLogin: (role: UserRole, establishmentId?: string) => void;
  onNavigate: (screen: AppScreen) => void;
};

const { colors, spacing, radius } = correctAiTheme;

export function LoginScreen({ onLogin, onNavigate }: AuthProps) {
  const [role, setRole] = useState<UserRole>('professor');
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const canSignUp = role === 'professor';
  const activeAdmins = admins.filter((a) => a.status === 'ACTIF');

  const handleLogin = () => {
    if (role === 'admin') {
      const admin = admins.find((a) => a.id === selectedAdminId);
      onLogin(role, admin?.establishmentId);
    } else {
      onLogin(role);
    }
  };

  return (
    <AuthFrame>
      <BrandTitle subtitle="Connexion a votre compte" />
      <View style={styles.form}>
        <RoleSwitch selectedRole={role} onChange={(nextRole) => { setRole(nextRole); setSelectedAdminId(null); }} />
        {role === 'admin' ? (
          <View style={styles.adminPicker}>
            <Text style={styles.pickerLabel}>Choisir un administrateur</Text>
            {activeAdmins.map((admin) => (
              <Pressable
                key={admin.id}
                onPress={() => setSelectedAdminId(admin.id)}
                style={[styles.adminOption, selectedAdminId === admin.id && styles.adminOptionActive]}>
                <Text style={[styles.adminOptionName, selectedAdminId === admin.id && styles.adminOptionNameActive]}>
                  {admin.name}
                </Text>
                <Text style={styles.adminOptionEst}>{admin.establishment}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Field autoCapitalize="none" keyboardType="email-address" placeholder="Email" />
        <Field placeholder="Mot de passe" secureTextEntry />
        <PrimaryButton icon={Icons.lock} onPress={handleLogin}>
          Se connecter
        </PrimaryButton>
        <TextButton icon={Icons.key} onPress={() => onNavigate('forgot-password')}>
          Mot de passe oublie ?
        </TextButton>
        {canSignUp ? (
          <TextButton icon={Icons.personAdd} onPress={() => onNavigate('signup')}>
            S'inscrire en tant que professeur
          </TextButton>
        ) : null}
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  adminPicker: {
    gap: spacing.xs,
  },
  pickerLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  adminOption: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  adminOptionName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  adminOptionNameActive: {
    color: colors.primary,
  },
  adminOptionEst: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
