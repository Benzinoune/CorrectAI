import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, FilterChips, FloatingButton, Icon, Icons, SearchRow, ScreenFrame } from '@/features/correctai/components/ui';
import { superAdminTabs } from '@/features/correctai/data/mock-data';
import type { ProfessorStatus } from '@/features/correctai/types';
import { ProfessorCard, SuperAdminScreenProps, normalizeSearch, styles } from './shared';

export function SuperAdminProfessorsScreen({
  activeTab,
  onNavigate,
  professorsData,
  onSelectProfessor,
}: SuperAdminScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | ProfessorStatus>('all');
  const [query, setQuery] = useState('');
  const professorList = professorsData ?? [];

  const visibleProfessors = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    return professorList.filter((professor) => {
      if (filter !== 'all' && professor.status !== filter) return false;
      if (!query) return true;
      const haystack = normalizeSearch(`${professor.name} ${professor.email} ${professor.establishment}`);
      return haystack.includes(normalizedQuery);
    });
  }, [filter, professorList, query]);

  const resultLabel = visibleProfessors.length === 1 ? '1 professeur' : `${visibleProfessors.length} professeurs`;

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Professeurs"
      onTabPress={(item) => onNavigate(item.screen)}
      scrollable={false}
      tabs={superAdminTabs}>
      <View style={styles.page}>
        <FlatList
          data={visibleProfessors}
          keyExtractor={(item) => item.id}
          style={styles.listView}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, visibleProfessors.length === 0 && styles.listEmpty]}
          ListHeaderComponent={
            <View style={styles.header}>
              <SearchRow onChangeText={setQuery} onClear={() => setQuery('')} placeholder="Rechercher un professeur" value={query} />
              <FilterChips
                active={filter}
                onChange={(value) => setFilter(value as 'all' | ProfessorStatus)}
                options={[
                  { id: 'all', label: 'Tous' },
                  { id: 'ACTIF', label: 'Actif' },
                  { id: 'INACTIF', label: 'Inactif' },
                  { id: 'SUSPENDU', label: 'Suspendu' },
                ]}
              />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{resultLabel}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Card icon={Icons.search} style={styles.emptyCard} title="Aucun professeur">
              <Text style={styles.emptyText}>Aucun professeur trouve.</Text>
            </Card>
          }
          renderItem={({ item }) => (
            <ProfessorCard
              professor={item}
              onPress={() => {
                onSelectProfessor?.(item);
                onNavigate('super-admin-professor-detail');
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
        <View style={[styles.fabWrap, { bottom: 84 + Math.max(insets.bottom, 16) }]}>
          <FloatingButton icon={Icons.personAdd} onPress={() => onNavigate('super-admin-new-professor')} style={styles.fabButton}>
            Nouveau professeur
          </FloatingButton>
        </View>
      </View>
    </ScreenFrame>
  );
}
