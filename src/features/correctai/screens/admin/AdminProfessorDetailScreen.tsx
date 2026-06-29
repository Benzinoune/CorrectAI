import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  Card,
  Icons,
  InfoRow,
  PrimaryButton,
  ScreenFrame,
  StatGrid,
  StatusPill,
} from '@/features/correctai/components/ui';
import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, NavItem, Professor, ProfessorStatus, Tone } from '@/features/correctai/types';

const { colors, spacing } = correctAiTheme;

type AdminScreenProps = {
  activeTab: NavItem['id'];
  adminEstablishmentId?: string;
  onNavigate: (screen: AppScreen) => void;
  onUpdateProfessor?: (professor: Professor) => void;
  onDeleteProfessor?: (professorId: string) => void;
  selectedProfessor?: Professor | null;
};

function statusTone(status: ProfessorStatus): Tone {
  if (status === 'ACTIF') return 'success';
  if (status === 'SUSPENDU') return 'warning';
  return 'neutral';
}

export function AdminProfessorDetailScreen({ onNavigate, onUpdateProfessor, onDeleteProfessor, selectedProfessor }: AdminScreenProps) {
  const professor = selectedProfessor;
  if (!professor) return null;
  const [status, setStatus] = useState<ProfessorStatus>(professor.status);

  const cycleStatus = () => {
    setStatus((current) => {
      const next: ProfessorStatus = current === 'ACTIF' ? 'SUSPENDU' : current === 'SUSPENDU' ? 'INACTIF' : 'ACTIF';
      onUpdateProfessor?.({ ...professor, status: next });
      return next;
    });
  };

  return (
    <ScreenFrame compactHeader onBack={() => onNavigate('admin-professors')} title="Details Prof">
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar initials={professor.initials} size={58} />
          <View style={styles.profileMeta}>
            <Text numberOfLines={1} style={styles.profileName}>{professor.name}</Text>
            <Text numberOfLines={1} style={styles.profileEmail}>{professor.email}</Text>
            <Text numberOfLines={1} style={styles.profileEstablishment}>{professor.establishment}</Text>
          </View>
          <StatusPill label={status} tone={statusTone(status)} />
        </View>
      </Card>

      <Card icon={Icons.lock} style={styles.credentialsCard} title="Compte professeur" subtitle="Identifiants de connexion">
        <InfoRow icon={Icons.mail} label="Email" value={professor.email} />
        <InfoRow icon={Icons.lock} label="Password" value={professor.password ? '••••••••' : 'Non defini'} />
      </Card>

      <StatGrid items={professor.stats} />
      <View style={styles.actions}>
        <PrimaryButton icon={Icons.shield} onPress={cycleStatus} variant="outline">
          Changer statut
        </PrimaryButton>
        <PrimaryButton icon={Icons.trash} onPress={() => {
          Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer le compte de ${professor.name} ? Cette action est irreversible.`,
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => {
                onDeleteProfessor?.(professor.id);
                onNavigate('admin-professors');
              }},
            ]
          );
        }} tone="warning" variant="soft">
          Supprimer le compte
        </PrimaryButton>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    paddingVertical: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  profileName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
  },
  profileEmail: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  profileEstablishment: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  credentialsCard: {
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
});
