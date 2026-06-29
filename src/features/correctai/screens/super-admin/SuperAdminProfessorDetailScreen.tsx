import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Avatar, Card, Icon, Icons, InfoRow, PrimaryButton, ScreenFrame, StatGrid, StatusPill } from '@/features/correctai/components/ui';
import type { ProfessorStatus } from '@/features/correctai/types';
import { SuperAdminScreenProps, statusTone, styles } from './shared';

export function SuperAdminProfessorDetailScreen({
  onNavigate,
  selectedProfessor,
  onUpdateProfessor,
  onDeleteProfessor,
}: SuperAdminScreenProps) {
  const professor = selectedProfessor;
  if (!professor) return null;
  const [status, setStatus] = useState<ProfessorStatus>(professor.status);

  const cycleStatus = () => {
    setStatus((prev) => {
      const next: ProfessorStatus = prev === 'ACTIF' ? 'SUSPENDU' : prev === 'SUSPENDU' ? 'INACTIF' : 'ACTIF';
      onUpdateProfessor?.({ ...professor, status: next });
      return next;
    });
  };

  return (
    <ScreenFrame compactHeader onBack={() => onNavigate('super-admin-professors')} title="Details Professeur">
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar initials={professor.initials} size={58} />
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{professor.name}</Text>
            <Text style={styles.profileEmail}>{professor.email}</Text>
            <Text style={styles.profileEstablishment}>{professor.establishment}</Text>
          </View>
          <StatusPill label={status} tone={statusTone(status)} />
        </View>
      </Card>

      <Card icon={Icons.lock} style={styles.credentialsCard} title="Compte professeur">
        <InfoRow icon={Icons.mail} label="Email" value={professor.email} />
        <InfoRow icon={Icons.lock} label="Mot de passe" value="••••••••" />
        <InfoRow icon={Icons.business} label="Etablissement" value={professor.establishment} />
      </Card>

      <StatGrid items={professor.stats} />

      <View style={styles.actions}>
        <PrimaryButton icon={Icons.shield} onPress={cycleStatus} variant="outline">
          Changer statut ({status === 'ACTIF' ? 'Suspendre' : status === 'SUSPENDU' ? 'Reactivier' : 'Activer'})
        </PrimaryButton>
        <PrimaryButton icon={Icons.key} variant="outline" tone="warning" onPress={() => {
          Alert.alert('Mot de passe reinitialise', `Le mot de passe de ${professor.name} a ete reinitialise a "changeme123".`);
          onUpdateProfessor?.({ ...professor, password: 'changeme123' });
        }}>
          Reinitialiser mot de passe
        </PrimaryButton>
        <PrimaryButton icon={Icons.trash} tone="danger" variant="soft" onPress={() => {
          Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer le compte de ${professor.name} ? Cette action est irreversible.`,
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => {
                onDeleteProfessor?.(professor.id);
                onNavigate('super-admin-professors');
              }},
            ]
          );
        }}>
          Supprimer le compte
        </PrimaryButton>
      </View>
    </ScreenFrame>
  );
}
