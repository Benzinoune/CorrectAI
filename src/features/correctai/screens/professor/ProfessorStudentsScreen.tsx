import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Card, FloatingButton, Icon, Icons, ScreenFrame, SearchRow } from '@/features/correctai/components/ui';
import { classes, professorTabs, students } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { ClassRoom, Student } from '@/features/correctai/types';
import { normalizeSearch, ProfessorScreenProps, studentClassLabels, studentDisplayName, tabPress } from './shared';
import { StudentCard } from './shared-components';

const { colors, spacing, radius } = correctAiTheme;

export function ProfessorStudentsScreen({
  activeTab,
  onNavigate,
  onSelectStudent,
  classesData,
  studentsData,
}: ProfessorScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const studentList = studentsData ?? students;
  const classList = classesData ?? classes;

  const visibleStudents = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());

    return [...studentList]
      .filter((student) => {
        if (!normalizedQuery) {
          return true;
        }

        return normalizeSearch(studentDisplayName(student)).includes(normalizedQuery);
      })
      .sort((left, right) => {
        const leftName = normalizeSearch(studentDisplayName(left));
        const rightName = normalizeSearch(studentDisplayName(right));

        return sortOrder === 'asc' ? leftName.localeCompare(rightName) : rightName.localeCompare(leftName);
      });
  }, [query, sortOrder, studentList]);

  const sortLabel = sortOrder === 'asc' ? 'Nom A-Z' : 'Nom Z-A';

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Mes Etudiants"
      onTabPress={tabPress(onNavigate)}
      scrollable={false}
      tabs={professorTabs}>
      <View style={styles.studentsPage}>
        <View style={styles.studentsToolbar}>
          <SearchRow
            placeholder="Rechercher un etudiant..."
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            sortLabel={sortLabel}
            onSortPress={() => setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))}
          />
        </View>

        <FlatList
          data={visibleStudents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudentCard
              item={item}
              classList={classList}
              onPress={() => {
                onSelectStudent?.(item);
                onNavigate('professor-student-detail');
              }}
            />
          )}
          style={styles.studentsList}
          contentContainerStyle={[
            styles.studentsListContent,
            { paddingBottom: 120 + Math.max(insets.bottom, spacing.sm) },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card icon={Icons.search} style={styles.studentsEmptyCard} title="Aucun etudiant trouve">
              <Text style={styles.studentsEmptyText}>
                Essayez un autre nom ou effacez la recherche pour voir tous les etudiants.
              </Text>
            </Card>
          }
        />

        <View
          pointerEvents="box-none"
          style={[
            styles.studentsFabOverlay,
            {
              paddingBottom: 84 + Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <FloatingButton
            onPress={() => onNavigate('professor-add-student')}
            style={styles.fabButton}>
            Nouvelle Etudiant
          </FloatingButton>
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  fabButton: { marginTop: 0 },
  studentsPage: {
    flex: 1,
    position: 'relative',
  },
  studentsToolbar: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  studentsList: {
    flex: 1,
    minHeight: 0,
  },
  studentsListContent: {
    gap: spacing.md,
  },
  studentsEmptyCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  studentsEmptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  studentCardPressable: {
    borderRadius: radius.lg,
  },
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#1F2440',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  studentHeaderText: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  studentSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  studentMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  studentMetaPill: {
    minHeight: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  studentMetaText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  studentClasses: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  studentsFabOverlay: {
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
});
