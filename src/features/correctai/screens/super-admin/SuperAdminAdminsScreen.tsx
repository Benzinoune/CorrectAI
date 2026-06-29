import { Text, View } from 'react-native';

import { Avatar, Card, FloatingButton, Icon, Icons, ScreenFrame, SectionTitle, StatusPill } from '@/features/correctai/components/ui';
import { admins as initialAdmins } from '@/features/correctai/data/mock-data';
import { AdminCard, SuperAdminScreenProps, statusTone, styles } from './shared';

export function SuperAdminAdminsScreen({
  onNavigate,
  selectedEstablishment,
  adminsData,
  onSelectAdmin,
}: SuperAdminScreenProps) {
    if (!selectedEstablishment) return null;
    const adminList = adminsData ?? initialAdmins;
    const establishmentAdmins = adminList.filter((a) => a.establishmentId === selectedEstablishment.id);

    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('super-admin-establishment-detail')} title="Admins Etablissement">
        <Text style={styles.sectionHint}>Admins pour: {selectedEstablishment.name}</Text>
        <SectionTitle>Administrateur principal</SectionTitle>
        <Card style={styles.adminCard}>
          <View style={styles.adminInfo}>
              <Avatar initials={selectedEstablishment.adminName.substring(0, 2).toUpperCase()} tone="orange" size={40} />
              <View>
                  <Text style={styles.adminName}>{selectedEstablishment.adminName}</Text>
                  <Text style={styles.adminEmail}>{selectedEstablishment.adminEmail}</Text>
              </View>
          </View>
          <StatusPill label="PRINCIPAL" tone="primary" />
        </Card>
        {establishmentAdmins.length > 0 ? (
          <>
            <SectionTitle>Admins ({establishmentAdmins.length})</SectionTitle>
            <View style={styles.listCard}>
              {establishmentAdmins.map((admin) => (
                <AdminCard key={admin.id} admin={admin} onPress={() => {
                  onSelectAdmin?.(admin);
                  onNavigate('super-admin-admin-detail');
                }} />
              ))}
            </View>
          </>
        ) : null}
        <View style={styles.fabContainer}>
          <FloatingButton icon={Icons.personAdd} onPress={() => onNavigate('super-admin-new-admin')}>Ajouter Admin</FloatingButton>
        </View>
      </ScreenFrame>
    );
  }
