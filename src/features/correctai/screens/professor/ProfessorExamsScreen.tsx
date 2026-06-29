import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ExamRow, FilterChips, FloatingButton, Icon, Icons, ScreenFrame, SearchRow } from '@/features/correctai/components/ui';
import { exams, professorTabs } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import { normalizeSearch, ProfessorScreenProps, scannedCopiesCount, sortExamsByDate, tabPress } from './shared';

const { colors, spacing, radius } = correctAiTheme;

export function ProfessorExamsScreen({
  activeTab,
  examsData,
  onNavigate,
  onSelectExam,
}: ProfessorScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const examList = examsData ?? exams;
  const statusOptions = [
    { id: 'all', label: 'Tous' },
    { id: 'ACTIF', label: 'Actif' },
    { id: 'BROUILLON', label: 'Brouillon' },
    { id: 'EN COURS', label: 'En cours' },
    { id: 'A VENIR', label: 'A venir' },
    { id: 'TERMINE', label: 'Termine' },
  ];

  const visibleExams = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    let filtered = examList;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.status === statusFilter);
    }
    const sortedExams = sortExamsByDate(filtered, sortAscending);
    if (!normalizedQuery) {
      return sortedExams;
    }
    return sortedExams.filter((exam) => normalizeSearch(exam.name).includes(normalizedQuery));
  }, [examList, query, sortAscending, statusFilter]);

  const sortIcon = sortAscending ? 'arrow-up-outline' : 'arrow-down-outline';

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Examens"
      onTabPress={tabPress(onNavigate)}
      scrollable={false}
      tabs={professorTabs}>
      <View style={styles.examsPage}>
        <View style={styles.examsToolbar}>
          <View style={styles.examsSearchWrap}>
            <SearchRow
              placeholder="Rechercher un examen..."
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={sortAscending ? 'Trier par date croissante' : 'Trier par date décroissante'}
            onPress={() => setSortAscending((current) => !current)}
            style={({ pressed }) => [
              styles.examsSortButton,
              sortAscending && styles.examsSortButtonActive,
              pressed && styles.pressed,
            ]}>
            <Icon name={sortIcon} color={sortAscending ? colors.primary : colors.muted} size={16} />
            <Text style={[styles.examsSortText, sortAscending && styles.examsSortTextActive]}>Date</Text>
          </Pressable>
        </View>

        <FilterChips active={statusFilter} options={statusOptions} onChange={setStatusFilter} />

        <FlatList
          data={visibleExams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExamRow
              copies={`${scannedCopiesCount(item)} copies`}
              date={item.date}
              subtitle={item.className}
              title={item.name}
              onPress={() => {
                onSelectExam?.(item);
                onNavigate('professor-exam-menu');
              }}
            />
          )}
          style={styles.examsList}
          contentContainerStyle={[
            styles.examsListContent,
            { paddingBottom: 120 + Math.max(insets.bottom, spacing.sm) },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card icon={Icons.search} style={styles.examsEmptyCard} title="Aucun examen trouve">
              <Text style={styles.examsEmptyText}>
                Essayez un autre nom ou effacez la recherche pour voir tous les examens.
              </Text>
            </Card>
          }
        />

        <View
          pointerEvents="box-none"
          style={[
            styles.classesFabOverlay,
            {
              paddingBottom: 84 + Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <FloatingButton onPress={() => onNavigate('professor-new-exam')} style={styles.fabButton}>
            Nouvel examen
          </FloatingButton>
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  fabButton: { marginTop: 0 },
  classesFabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 20,
    elevation: 20,
    paddingHorizontal: spacing.md,
  },
  examsPage: {
    flex: 1,
    position: 'relative',
  },
  examsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  examsSearchWrap: {
    flex: 1,
    minWidth: 0,
  },
  examsSortButton: {
    minWidth: 86,
    height: 48,
    borderRadius: radius.xs,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  examsSortButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  examsSortText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  examsSortTextActive: {
    color: colors.primary,
  },
  examsList: {
    flex: 1,
    minHeight: 0,
  },
  examsListContent: {
    gap: spacing.md,
  },
  examsEmptyCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  examsEmptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
