import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Card, Field, FormActions, Icon, Icons, ScreenFrame } from '@/features/correctai/components/ui';
import { classes, exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { Exam, ResponseSheetId } from '@/features/correctai/types';
import {
  classNamesFromIds,
  formatExamDate,
  formatExamDateForStorage,
  getResponseSheetOption,
  normalizeSearch,
  ProfessorScreenProps,
  responseSheetOptions,
  styles as sharedStyles,
} from './shared';

const { colors, spacing, radius } = correctAiTheme;

type ExamFormErrors = {
  name?: string;
  subject?: string;
  classes?: string;
};

function validateExamForm(values: { name: string; subject: string; selectedClasses: string[]; existingExams: { name: string }[] }): ExamFormErrors {
  const errors: ExamFormErrors = {};
  const trimmedName = values.name.trim();

  if (!trimmedName) {
    errors.name = "Le nom de l'examen est requis.";
  } else if (values.existingExams.some((e) => normalizeSearch(e.name) === normalizeSearch(trimmedName))) {
    errors.name = 'Un examen avec ce nom existe déjà.';
  }

  if (!values.subject.trim()) {
    errors.subject = 'La matière est requise.';
  }

  if (values.selectedClasses.length === 0) {
    errors.classes = 'Sélectionnez au moins une classe.';
  }

  return errors;
}

function ExamDatePickerModal({
  initialDate,
  visible,
  onCancel,
  onConfirm,
}: {
  initialDate: Date;
  visible: boolean;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}) {
  const [draftDate, setDraftDate] = useState(initialDate);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftDate(initialDate);
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
  }, [initialDate, opacity, scale, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.classModalRoot}>
        <View style={styles.classModalLayer}>
          <Pressable onPress={onCancel} style={styles.classModalBackdrop} />
          <Animated.View style={[styles.classModalCard, { opacity, transform: [{ scale }] }]}>
            <Text style={styles.classModalTitle}>Date de l&apos;examen</Text>
            <View style={styles.examDatePickerBody}>
              <DateTimePicker
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                mode="date"
                value={draftDate}
                onChange={(_, nextDate) => {
                  if (nextDate) {
                    setDraftDate(nextDate);
                  }
                }}
              />
            </View>
            <View style={styles.classModalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={({ pressed }) => [styles.classModalAction, styles.classModalNeutralAction, pressed && styles.pressed]}>
                <Text style={styles.classModalNeutralText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onConfirm(draftDate)}
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

function ResponseSheetPickerModal({
  initialValue,
  visible,
  onCancel,
  onConfirm,
}: {
  initialValue: ResponseSheetId;
  visible: boolean;
  onCancel: () => void;
  onConfirm: (value: ResponseSheetId) => void;
}) {
  const [draftValue, setDraftValue] = useState<ResponseSheetId>(initialValue);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftValue(initialValue);
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
  }, [initialValue, opacity, scale, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.classModalRoot}>
        <View style={styles.classModalLayer}>
          <Pressable onPress={onCancel} style={styles.classModalBackdrop} />
          <Animated.View style={[styles.classModalCard, { opacity, transform: [{ scale }] }]}>
            <Text style={styles.classModalTitle}>Feuille de réponse</Text>
            <View style={styles.responseSheetOptions}>
              {responseSheetOptions.map((option) => {
                const selected = draftValue === option.id;

                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={option.id}
                    onPress={() => setDraftValue(option.id)}
                    style={({ pressed }) => [
                      styles.responseSheetOption,
                      selected && styles.responseSheetOptionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.responseSheetOptionTextBlock}>
                      <Text style={styles.responseSheetOptionTitle}>{option.label}</Text>
                      <Text style={styles.responseSheetOptionSubtitle}>{option.questions} questions</Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected ? <Icon name={Icons.check} color={colors.card} size={14} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.classModalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={({ pressed }) => [styles.classModalAction, styles.classModalNeutralAction, pressed && styles.pressed]}>
                <Text style={styles.classModalNeutralText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onConfirm(draftValue)}
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

export function ProfessorNewExamScreen({ classesData, examsData, onCreateExam, onNavigate }: ProfessorScreenProps) {
  const classList = classesData ?? classes;
  const examList = examsData ?? exams;
  const [examName, setExamName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [responseSheetId, setResponseSheetId] = useState<ResponseSheetId>('20');
  const [examDate, setExamDate] = useState(() => new Date());
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isResponseSheetOpen, setIsResponseSheetOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<ExamFormErrors>({});
  const selectedResponseSheet = getResponseSheetOption(responseSheetId);
  const questionCount = selectedResponseSheet.questions;

  useEffect(() => {
    setSelectedClasses((current) => current.filter((classId) => classList.some((classItem) => classItem.id === classId)));
  }, [classList]);

  const toggleClass = (classId: string) => {
    setSelectedClasses((current) =>
      current.includes(classId) ? current.filter((item) => item !== classId) : [...current, classId],
    );
  };

  const handleSubmit = () => {
    const nextErrors = validateExamForm({
      name: examName,
      subject: subjectName,
      selectedClasses,
      existingExams: examList,
    });

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const resolvedClasses = classNamesFromIds(selectedClasses, classList);
    const nextExam: Omit<Exam, 'id'> = {
      name: examName.trim(),
      subject: subjectName.trim(),
      className: resolvedClasses.length > 0 ? resolvedClasses.join(', ') : 'Aucune classe',
      classIds: [...selectedClasses],
      date: formatExamDateForStorage(examDate),
      copies: 0,
      status: 'BROUILLON',
      questions: questionCount,
      establishmentId: '',
      responseSheetId: selectedResponseSheet.id,
    };

    onCreateExam?.(nextExam);
    onNavigate('professor-exam-menu');
  };

  return (
    <ScreenFrame compactHeader scrollable={false} onBack={() => onNavigate('professor-exams')} title="Nouvel Examen">
      <View style={styles.newExamPage}>
        <View style={styles.newExamFields}>
          <Field
            autoCapitalize="sentences"
            label="Nom de l'examen *"
            placeholder="ex: Controle 1, Quiz Math..."
            value={examName}
            onChangeText={(text) => { setExamName(text); if (formErrors.name) setFormErrors((current) => ({ ...current, name: undefined })); }}
          />
          {formErrors.name ? <Text style={styles.studentFormError}>{formErrors.name}</Text> : null}
          <Field
            autoCapitalize="words"
            label="Matière *"
            placeholder="ex: Mathematiques"
            value={subjectName}
            onChangeText={(text) => { setSubjectName(text); if (formErrors.subject) setFormErrors((current) => ({ ...current, subject: undefined })); }}
          />
          {formErrors.subject ? <Text style={styles.studentFormError}>{formErrors.subject}</Text> : null}
          <View style={styles.newExamSection}>
            <Text style={styles.fieldHeading}>Feuille de réponse *</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsResponseSheetOpen(true)}
              style={({ pressed }) => [styles.newExamSelectButton, pressed && styles.pressed]}>
              <View style={styles.newExamSelectMain}>
                <Icon name={Icons.doc} color={colors.primary} size={16} />
                <View style={styles.newExamSelectTextBlock}>
                  <Text numberOfLines={1} style={styles.newExamSelectValue}>
                    {selectedResponseSheet.label}
                  </Text>
                  <Text style={styles.newExamSelectHint}>{questionCount} questions</Text>
                </View>
              </View>
              <Icon name={Icons.chevronDown} color={colors.muted} size={18} />
            </Pressable>
          </View>

          <View style={styles.newExamSection}>
            <Text style={styles.fieldHeading}>Date de l&apos;examen *</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsDatePickerOpen(true)}
              style={({ pressed }) => [styles.newExamDateButton, pressed && styles.pressed]}>
              <Icon name={Icons.calendar} color={colors.primary} size={16} />
              <Text style={styles.newExamDateText}>{formatExamDate(examDate)}</Text>
            </Pressable>
          </View>

        </View>

        <Card
          icon={Icons.school}
          style={styles.classSelectCard}
          title={`Classes (${selectedClasses.length})`}
          subtitle="Selection multiple">
          {formErrors.classes ? <Text style={[styles.studentFormError, { marginHorizontal: spacing.sm, marginBottom: spacing.xs }]}>{formErrors.classes}</Text> : null}
          <FlatList
            data={classList}
            extraData={selectedClasses}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => {
              const selected = selectedClasses.includes(item.id);

              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleClass(item.id)}
                  style={({ pressed }) => [
                    styles.classSelectRow,
                    selected && styles.classSelectRowSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? <Icon name={Icons.check} color={colors.card} size={14} /> : null}
                  </View>
                  <View style={styles.classSelectRowText}>
                    <Text numberOfLines={1} style={styles.classSelectTitle}>
                      {item.name}
                    </Text>
                    <Text style={styles.classSelectSubtitle}>
                      {item.students} etudiants - {item.exams} examens
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            showsVerticalScrollIndicator={false}
            style={styles.classSelectList}
            contentContainerStyle={styles.classSelectListContent}
            ItemSeparatorComponent={() => <View style={styles.classSelectSeparator} />}
            ListEmptyComponent={
              <View style={styles.newExamEmptyState}>
                <Icon name={Icons.search} color={colors.primary} size={18} />
                <Text style={styles.newExamEmptyText}>
                  Créez une classe pour pouvoir l&apos;ajouter à un examen.
                </Text>
              </View>
            }
          />
        </Card>

        <FormActions
          onCancel={() => onNavigate('professor-exams')}
          onSubmit={handleSubmit}
        />
      </View>

      <ExamDatePickerModal
        initialDate={examDate}
        visible={isDatePickerOpen}
        onCancel={() => setIsDatePickerOpen(false)}
        onConfirm={(date) => {
          setExamDate(date);
          setIsDatePickerOpen(false);
        }}
      />
      <ResponseSheetPickerModal
        initialValue={responseSheetId}
        visible={isResponseSheetOpen}
        onCancel={() => setIsResponseSheetOpen(false)}
        onConfirm={(value) => {
          setResponseSheetId(value);
          setIsResponseSheetOpen(false);
        }}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  studentFormError: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  fieldHeading: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  newExamPage: {
    flex: 1,
    minHeight: 0,
    gap: spacing.md,
  },
  newExamFields: {
    gap: spacing.md,
  },
  newExamSection: {
    gap: spacing.xs,
  },
  newExamDateButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  newExamDateText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  newExamSelectButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1.2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  newExamSelectMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  newExamSelectTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  newExamSelectValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  newExamSelectHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  classSelectCard: {
    flex: 1,
    minHeight: 0,
  },
  classSelectList: {
    flex: 1,
    minHeight: 0,
  },
  classSelectListContent: {
    paddingBottom: spacing.xs,
  },
  classSelectRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  classSelectRowSelected: {
    backgroundColor: colors.primarySoft,
  },
  classSelectRowText: {
    flex: 1,
    gap: 2,
  },
  classSelectTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  classSelectSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  classSelectSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 36,
  },
  newExamEmptyState: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  newExamEmptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  examDatePickerBody: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    alignItems: 'stretch',
  },
  responseSheetOptions: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
  },
  responseSheetOption: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  responseSheetOptionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  responseSheetOptionTextBlock: {
    flex: 1,
    gap: 2,
  },
  responseSheetOptionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  responseSheetOptionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
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
  classModalNeutralAction: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  classModalPrimaryAction: {},
  classModalNeutralText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  classModalPrimaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
