import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, FilterChips, FloatingButton, Icons, ScreenFrame, SearchRow } from '@/features/correctai/components/ui';
import { ProfessorCard } from '@/features/correctai/components/professor-card';
import { adminTabs } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, NavItem, Professor, ProfessorStatus, Tone } from '@/features/correctai/types';

const { colors, spacing } = correctAiTheme;

type AdminScreenProps = {
  activeTab: NavItem['id'];
  adminEstablishmentId?: string;
  onNavigate: (screen: AppScreen) => void;
  onSelectProfessor?: (professor: Professor) => void;
  professorsData?: Professor[];
};

function statusTone(status: ProfessorStatus): Tone {
  if (status === 'ACTIF') {
    return 'success';
  }
  if (status === 'SUSPENDU') {
    return 'warning';
  }
  return 'neutral';
}

function normalizeSearch(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchesProfessorSearch(professor: Professor, query: string) {
  if (!query) {
    return true;
  }

  const haystack = normalizeSearch(
    `${professor.name} ${professor.email} ${professor.establishment} ${professor.status}`
  );

  return haystack.includes(query);
}

export function AdminProfessorsScreen({
  activeTab,
  adminEstablishmentId,
  onNavigate,
  onSelectProfessor,
  professorsData,
}: AdminScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | ProfessorStatus>('all');
  const [query, setQuery] = useState('');
  const professorList = useMemo(
    () => (professorsData ?? []).filter((p) => !adminEstablishmentId || p.establishmentId === adminEstablishmentId),
    [adminEstablishmentId, professorsData],
  );

  const visibleProfessors = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());

    return professorList.filter((professor) => {
      if (filter !== 'all' && professor.status !== filter) {
        return false;
      }

      return matchesProfessorSearch(professor, normalizedQuery);
    });
  }, [filter, professorList, query]);

  const resultLabel =
    visibleProfessors.length === 1 ? '1 professeur' : `${visibleProfessors.length} professeurs`;

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Professeurs"
      onTabPress={(item) => onNavigate(item.screen)}
      scrollable={false}
      tabs={adminTabs}>
      <View style={styles.page}>
        <FlatList
          data={visibleProfessors}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            visibleProfessors.length === 0 && styles.listEmpty,
          ]}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <SearchRow
                value={query}
                onChangeText={setQuery}
                onClear={() => setQuery('')}
                placeholder="Rechercher un professeur"
              />
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
                <Text style={styles.metaHint}>Filtrage en temps reel</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Card icon={Icons.search} style={styles.emptyCard} title="Aucun professeur trouve">
              <Text style={styles.emptyText}>
                Essayez un autre nom, email ou changez le filtre de statut.
              </Text>
            </Card>
          }
          renderItem={({ item }) => (
            <ProfessorCard
              professor={item}
              statusTone={statusTone(item.status)}
              onPress={() => {
                onSelectProfessor?.(item);
                onNavigate('admin-professor-detail');
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[
            styles.fabWrap,
            { bottom: 84 + Math.max(insets.bottom, spacing.xs) },
          ]}>
          <FloatingButton
            icon={Icons.personAdd}
            onPress={() => onNavigate('admin-new-professor')}
            style={styles.fabButton}>
            Nouveau professeur
          </FloatingButton>
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    position: 'relative',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
    gap: spacing.sm,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  headerBlock: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  metaHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 10,
    elevation: 10,
  },
  fabButton: {
    marginTop: 0,
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
