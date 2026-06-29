import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Card,
  ExamRow,
  FloatingButton,
  Icons,
  Icon,
  PrimaryButton,
  ScreenFrame,
  SearchRow,
  SegmentedControl,
} from '@/features/correctai/components/ui';
import { classes, exams, students } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { ClassRoom, Student } from '@/features/correctai/types';
import {
  classMatchesSelection,
  examMatchesClass,
  normalizeSearch,
  ProfessorScreenProps,
  scannedCopiesCount,
  sortExamsByDate,
  studentClassLabels,
  studentDisplayName,
} from './shared';
import { StudentCard } from './shared-components';

const { colors, spacing, radius } = correctAiTheme;

function ClassEditModal({
  visible,
  initialName,
  onCancel,
  onDelete,
  onSave,
}: {
  visible: boolean;
  initialName: string;
  onCancel: () => void;
  onDelete: () => void;
  onSave: (nextName: string) => void;
}) {
  const [draftName, setDraftName] = useState(initialName);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftName(initialName);
    opacity.setValue(0);
    scale.setValue(0.96);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [initialName, opacity, scale, visible]);

  if (!visible) {
    return null;
  }

  const handleSave = () => {
    const nextName = draftName.trim();
    if (!nextName) {
      return;
    }

    onSave(nextName);
  };

  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.classModalRoot}>
        <View style={styles.classModalLayer}>
          <Pressable onPress={onCancel} style={styles.classModalBackdrop} />
          <Animated.View style={[styles.classModalCard, { opacity, transform: [{ scale }] }]}>
            <Text style={styles.classModalTitle}>Modifier la classe</Text>

            <View style={styles.classModalFieldGroup}>
              <Text style={styles.classModalLabel}>Nom de la classe *</Text>
              <View style={styles.classModalInputShell}>
                <Icon name={Icons.school} color={colors.primary} size={16} />
                <TextInput
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  placeholder="Nom de la classe"
                  placeholderTextColor={colors.faint}
                  selectionColor={colors.primary}
                  style={styles.classModalInput}
                  value={draftName}
                  onChangeText={setDraftName}
                />
              </View>
              <View style={styles.classModalHintRow}>
                <Icon name={Icons.info} color={colors.primary} size={12} />
                <Text style={styles.classModalHint}>
                  Le nom sera mis à jour pour tous les examens liés.
                </Text>
              </View>
            </View>

            <View style={styles.classModalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onDelete}
                style={({ pressed }) => [styles.classModalAction, styles.classModalDangerAction, pressed && styles.pressed]}>
                <Text style={styles.classModalDangerText}>Supprimer</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={({ pressed }) => [styles.classModalAction, styles.classModalNeutralAction, pressed && styles.pressed]}>
                <Text style={styles.classModalNeutralText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleSave}
                style={({ pressed }) => [styles.classModalAction, styles.classModalPrimaryAction, pressed && styles.pressed]}>
                <Text style={styles.classModalPrimaryText}>Enregistrer</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DeleteClassConfirmModal({
  className,
  visible,
  onCancel,
  onConfirm,
}: {
  className: string;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    opacity.setValue(0);
    scale.setValue(0.96);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible>
      <View style={styles.classModalRoot}>
        <View style={styles.classModalLayer}>
          <Pressable onPress={onCancel} style={styles.classModalBackdrop} />
          <Animated.View style={[styles.classDeleteCard, { opacity, transform: [{ scale }] }]}>
            <View style={styles.classDeleteIconWrap}>
              <Icon name={Icons.trash} color={colors.danger} size={18} />
            </View>
            <Text style={styles.classDeleteTitle}>Supprimer la classe ?</Text>
            <Text style={styles.classDeleteText}>
              La classe <Text style={styles.classDeleteTextStrong}>{className}</Text> sera retirée de
              l&apos;application.
            </Text>
            <View style={styles.classDeleteActions}>
              <PrimaryButton onPress={onCancel} tone="neutral" variant="soft" style={styles.classDeleteButton}>
                Annuler
              </PrimaryButton>
              <PrimaryButton onPress={onConfirm} tone="danger" style={styles.classDeleteButton}>
                Supprimer
              </PrimaryButton>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

export function ProfessorClassDetailScreen({
  onNavigate,
  selectedClass,
  onSelectStudent,
  onSelectExam,
  onDeleteClass,
  onUpdateClass,
  classesData,
  examsData,
  studentsData,
}: ProfessorScreenProps) {
  const insets = useSafeAreaInsets();
  const classList = classesData ?? classes;
  const examList = examsData ?? exams;
  const studentList = studentsData ?? students;
  const currentClass = selectedClass ?? classList[0] ?? null;
  const [segment, setSegment] = useState<'students' | 'exams'>('students');
  const [studentQuery, setStudentQuery] = useState('');
  const [studentSortOrder, setStudentSortOrder] = useState<'asc' | 'desc'>('asc');
  const [examQuery, setExamQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setIsEditOpen(false);
    setIsDeleteOpen(false);
  }, [currentClass?.id]);

  const classStudents = useMemo(() => {
    if (!currentClass) {
      return [];
    }

    return studentList.filter((student) => student.classes.some((value) => classMatchesSelection(value, currentClass)));
  }, [currentClass, studentList]);

  const classExams = useMemo(() => {
    if (!currentClass) {
      return [];
    }

    return examList.filter((exam) => examMatchesClass(exam, currentClass));
  }, [currentClass, examList]);

  const visibleStudents = useMemo(() => {
    const normalizedQuery = normalizeSearch(studentQuery.trim());

    return [...classStudents]
      .filter((student) => {
        if (!normalizedQuery) {
          return true;
        }

        return normalizeSearch(studentDisplayName(student)).includes(normalizedQuery);
      })
      .sort((left, right) => {
        const leftName = normalizeSearch(studentDisplayName(left));
        const rightName = normalizeSearch(studentDisplayName(right));

        return studentSortOrder === 'asc' ? leftName.localeCompare(rightName) : rightName.localeCompare(leftName);
      });
  }, [classStudents, studentQuery, studentSortOrder]);

  const studentSortLabel = studentSortOrder === 'asc' ? 'Nom A-Z' : 'Nom Z-A';

  const visibleExams = useMemo(() => {
    const normalizedQuery = normalizeSearch(examQuery.trim());
    const sortedExams = sortExamsByDate(classExams, sortAscending);

    if (!normalizedQuery) {
      return sortedExams;
    }

    return sortedExams.filter((exam) => normalizeSearch(exam.name).includes(normalizedQuery));
  }, [classExams, examQuery, sortAscending]);

  const examSortIcon = sortAscending ? 'arrow-up-outline' : 'arrow-down-outline';

  if (!currentClass) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-classes')} title="Detail Classe">
        <Card icon={Icons.info} style={styles.listCard} title="Aucune classe disponible">
          <Text style={styles.emptyText}>Créez une classe pour commencer.</Text>
        </Card>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      compactHeader
      onBack={() => onNavigate('professor-classes')}
      rightAction={{ icon: Icons.edit, onPress: () => setIsEditOpen(true) }}
      title="Detail Classe">
      <View style={styles.classDetailPage}>
        <Text style={styles.nameLine}>
          Name : <Text style={styles.nameAccent}>{currentClass.name}</Text>
        </Text>
        <SegmentedControl
          active={segment}
          onChange={(value) => setSegment(value as 'students' | 'exams')}
          options={[
            { id: 'students', label: 'Etudiants' },
            { id: 'exams', label: 'Examens' },
          ]}
        />

        {segment === 'students' ? (
          <View style={styles.studentsPage}>
            <View style={styles.studentsToolbar}>
              <SearchRow
                placeholder="Rechercher un etudiant..."
                value={studentQuery}
                onChangeText={setStudentQuery}
                onClear={() => setStudentQuery('')}
                sortLabel={studentSortLabel}
                onSortPress={() => setStudentSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))}
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
              <FloatingButton onPress={() => onNavigate('professor-add-student')} style={styles.fabButton}>
                Nouvelle Etudiant
              </FloatingButton>
            </View>
          </View>
        ) : (
          <View style={styles.examsPage}>
            <View style={styles.examsToolbar}>
              <View style={styles.examsSearchWrap}>
                <SearchRow
                  placeholder="Rechercher un examen..."
                  value={examQuery}
                  onChangeText={setExamQuery}
                  onClear={() => setExamQuery('')}
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
                <Icon name={examSortIcon} color={sortAscending ? colors.primary : colors.muted} size={16} />
                <Text style={[styles.examsSortText, sortAscending && styles.examsSortTextActive]}>Date</Text>
              </Pressable>
            </View>

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
        )}
      </View>

      <ClassEditModal
        initialName={currentClass.name}
        visible={isEditOpen}
        onCancel={() => setIsEditOpen(false)}
        onDelete={() => {
          setIsEditOpen(false);
          setIsDeleteOpen(true);
        }}
        onSave={(nextName) => {
          onUpdateClass?.({
            ...currentClass,
            name: nextName,
          });
          setIsEditOpen(false);
        }}
      />
      <DeleteClassConfirmModal
        className={currentClass.name}
        visible={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          onDeleteClass?.(currentClass.id);
          setIsDeleteOpen(false);
          setIsEditOpen(false);
          onNavigate('professor-classes');
        }}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  listCard: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  classDetailPage: {
    flex: 1,
    minHeight: 0,
    gap: spacing.md,
  },
  nameLine: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  nameAccent: {
    color: '#13935E',
  },
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
  fabButton: {
    marginTop: 0,
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
  pressed: {
    opacity: 0.72,
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
  classModalRoot: {
    flex: 1,
  },
  classModalLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  classModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 22, 38, 0.52)',
  },
  classModalCard: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingTop: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#1F2440',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  classModalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  classModalFieldGroup: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  classModalLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  classModalInputShell: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
  },
  classModalInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 0,
  },
  classModalHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  classModalHint: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  classModalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 56,
  },
  classModalAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  classModalDangerAction: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  classModalDangerText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  classModalNeutralAction: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  classModalNeutralText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  classModalPrimaryAction: {},
  classModalPrimaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  classDeleteCard: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: spacing.lg,
    shadowColor: '#1F2440',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    alignItems: 'center',
    gap: spacing.md,
  },
  classDeleteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classDeleteTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  classDeleteText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  classDeleteTextStrong: {
    color: colors.ink,
    fontWeight: '800',
  },
  classDeleteActions: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  classDeleteButton: {
    flex: 1,
  },
});
