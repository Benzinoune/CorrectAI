import { Alert, Text, View } from 'react-native';

import { Avatar, Card, EmptyGap, Icon, Icons, PrimaryButton, ScreenFrame, SectionTitle, StatGrid, StatusPill } from '@/features/correctai/components/ui';
import { correctAiTheme } from '@/features/correctai/theme';
import { SuperAdminScreenProps, statusTone, styles } from './shared';

const { colors, spacing } = correctAiTheme;

export function SuperAdminEstablishmentDetailScreen({ onNavigate, selectedEstablishment, onDeleteEstablishment }: SuperAdminScreenProps) {
  if (!selectedEstablishment) return null;

  return (
    <ScreenFrame compactHeader onBack={() => onNavigate('super-admin-establishments')} title="Details Etablissement">
      <Card icon={Icons.school} style={styles.profileCard} title="Informations">
        <View style={styles.avatarWrap}>
            <Icon name={Icons.business} size={32} color={colors.primary} />
        </View>
        <Text style={styles.profileName}>{selectedEstablishment.name}</Text>
        <Text style={styles.profileEmail}>{selectedEstablishment.city}</Text>
        <StatusPill label={selectedEstablishment.status} tone={statusTone(selectedEstablishment.status)} />
      </Card>

      <SectionTitle>Administrateur</SectionTitle>
      <Card style={styles.adminCard}>
        <View style={styles.adminInfo}>
            <Avatar initials={selectedEstablishment.adminName.substring(0, 2).toUpperCase()} tone="orange" size={40} />
            <View>
                <Text style={styles.adminName}>{selectedEstablishment.adminName}</Text>
                <Text style={styles.adminEmail}>{selectedEstablishment.adminEmail}</Text>
            </View>
        </View>
        <PrimaryButton variant="outline" onPress={() => onNavigate('super-admin-admins')} style={{marginTop: spacing.md}}>Gerer les admins</PrimaryButton>
      </Card>

      <SectionTitle>Statistiques</SectionTitle>
      <StatGrid items={selectedEstablishment.stats} />

      <EmptyGap />
      <PrimaryButton icon={Icons.gear} variant="outline" onPress={() => onNavigate('super-admin-establishment-settings')}>Parametres</PrimaryButton>
      <EmptyGap size={spacing.xs} />
      <PrimaryButton icon={Icons.trash} tone="danger" variant="soft" onPress={() => {
        Alert.alert(
          'Confirmer la suppression',
          `Voulez-vous vraiment supprimer ${selectedEstablishment.name} ? Cette action est irreversible.`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => {
              onDeleteEstablishment?.(selectedEstablishment.id);
              onNavigate('super-admin-establishments');
            }},
          ]
        );
      }}>Supprimer l'etablissement</PrimaryButton>
      <EmptyGap />
    </ScreenFrame>
  );
}
