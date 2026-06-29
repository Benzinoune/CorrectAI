import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Card, Icon, Icons, ScreenFrame, SectionTitle, StatGrid } from '@/features/correctai/components/ui';
import { superAdminTabs } from '@/features/correctai/data/mock-data';
import type { StatItem } from '@/features/correctai/types';
import { EstablishmentCard, SuperAdminScreenProps, styles } from './shared';

export function SuperAdminHomeScreen({
  activeTab,
  onNavigate,
  establishmentsData,
  onSelectEstablishment,
  adminsData,
  professorsData,
  classesCount = 0,
  studentsCount = 0,
  examsCount = 0,
  copiesCount = 0,
}: SuperAdminScreenProps) {
  const adminList = adminsData ?? [];
  const professorList = professorsData ?? [];

  const globalStats: StatItem[] = useMemo(
    () => [
      { label: 'Etablissements', value: String(establishmentsData.length), tone: 'primary' as const },
      { label: 'Professeurs', value: String(professorList.length), tone: 'primary' as const },
      { label: 'Etudiants', value: String(studentsCount), tone: 'primary' as const },
    ],
    [establishmentsData.length, professorList.length, studentsCount],
  );

  const activityStats: StatItem[] = useMemo(
    () => [
      { label: 'Admins', value: String(adminList.length), tone: 'info' as const },
      { label: 'Classes', value: String(classesCount), tone: 'info' as const },
      { label: 'Examens', value: String(examsCount), tone: 'warning' as const },
      { label: 'Copies', value: String(copiesCount), tone: 'neutral' as const },
    ],
    [adminList.length, classesCount, copiesCount, examsCount],
  );

  const activeEstablishments = establishmentsData.filter((e) => e.status === 'ACTIF').length;

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Bonjour, Super Admin"
      onTabPress={(item) => onNavigate(item.screen)}
      tabs={superAdminTabs}>
      <Card style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{establishmentsData.length}</Text>
            <Text style={styles.overviewLabel}>Total etablissements</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: '#22c55e' }]}>{activeEstablishments}</Text>
            <Text style={styles.overviewLabel}>Actifs</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{establishmentsData.length - activeEstablishments}</Text>
            <Text style={styles.overviewLabel}>Inactifs</Text>
          </View>
        </View>
      </Card>

      <SectionTitle>Vue d'ensemble</SectionTitle>
      <StatGrid items={globalStats} />

      <SectionTitle>Activite</SectionTitle>
      <StatGrid items={activityStats} />

      <SectionTitle>Etablissements recents</SectionTitle>
      <View style={styles.listCard}>
        {establishmentsData.slice(0, 3).map((est) => (
          <EstablishmentCard
            key={est.id}
            establishment={est}
            onPress={() => {
              onSelectEstablishment?.(est);
              onNavigate('super-admin-establishment-detail');
            }}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}
