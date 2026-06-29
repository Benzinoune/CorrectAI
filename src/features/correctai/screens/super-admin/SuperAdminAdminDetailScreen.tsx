import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Avatar, Card, Icon, Icons, InfoRow, PrimaryButton, ScreenFrame, StatusPill } from '@/features/correctai/components/ui';
import type { AdminStatus } from '@/features/correctai/types';
import { SuperAdminScreenProps, statusTone, styles } from './shared';

export function SuperAdminAdminDetailScreen({
  onNavigate,
  selectedAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
}: SuperAdminScreenProps) {
  if (!selectedAdmin) return null;
  const [currentStatus, setCurrentStatus] = useState<AdminStatus>(selectedAdmin.status);

  const cycleStatus = () => {
    setCurrentStatus((prev) => {
      const next: AdminStatus = prev === 'ACTIF' ? 'SUSPENDU' : prev === 'SUSPENDU' ? 'INACTIF' : 'ACTIF';
      onUpdateAdmin?.({ ...selectedAdmin, status: next });
      return next;
    });
  };

  return (
    <ScreenFrame compactHeader onBack={() => onNavigate('super-admin-admins')} title="Details Admin">
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar initials={selectedAdmin.initials} size={58} />
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{selectedAdmin.name}</Text>
            <Text style={styles.profileEmail}>{selectedAdmin.email}</Text>
          </View>
          <StatusPill label={currentStatus} tone={statusTone(currentStatus)} />
        </View>
      </Card>

      <Card icon={Icons.lock} style={styles.credentialsCard} title="Compte administrateur">
        <InfoRow icon={Icons.mail} label="Email" value={selectedAdmin.email} />
        <InfoRow icon={Icons.lock} label="Mot de passe" value="••••••••" />
        <InfoRow icon={Icons.business} label="Etablissement" value={selectedAdmin.establishment} />
      </Card>

      <View style={styles.actions}>
        <PrimaryButton icon={Icons.shield} onPress={cycleStatus} variant="outline">
          Changer statut ({currentStatus === 'ACTIF' ? 'Suspendre' : currentStatus === 'SUSPENDU' ? 'Reactivier' : 'Activer'})
        </PrimaryButton>
        <PrimaryButton icon={Icons.key} variant="outline" tone="warning" onPress={() => {
          Alert.alert('Mot de passe reinitialise', `Le mot de passe de ${selectedAdmin.name} a ete reinitialise a "changeme123".`);
          onUpdateAdmin?.({ ...selectedAdmin, password: 'changeme123' });
        }}>
          Reinitialiser mot de passe
        </PrimaryButton>
        <PrimaryButton icon={Icons.trash} tone="danger" variant="soft" onPress={() => {
          Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer le compte de ${selectedAdmin.name} ? Cette action est irreversible.`,
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => {
                onDeleteAdmin?.(selectedAdmin.id);
                onNavigate('super-admin-admins');
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
