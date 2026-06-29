import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInputProps,
} from 'react-native';

import {
  Card,
  Field,
  FormActions,
  Icon,
  Icons,
  PrimaryButton,
  ScreenFrame,
} from '@/features/correctai/components/ui';
import { classes, students } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { Student } from '@/features/correctai/types';
import {
  emailPattern,
  ProfessorScreenProps,
  resolveSelectedClassIds,
  StudentFormErrors,
  StudentFormValues,
  studentDisplayName,
  validateStudentForm,
} from './shared';
import { StudentFormField } from './shared-components';

const { colors, spacing, radius } = correctAiTheme;

export function ProfessorStudentEditScreen({
  onNavigate,
  selectedStudent,
  classesData,
  studentsData,
  onUpdateStudent,
  onDeleteStudent,
}: ProfessorScreenProps) {
  const classList = classesData ?? classes;
  const studentList = studentsData ?? students;
  const student =
    studentList.find((item) => item.id === selectedStudent?.id) ?? selectedStudent ?? studentList[0] ?? students[0];
  const [draftStudent, setDraftStudent] = useState<Student>(() => ({
    ...student,
    classes: [...student.classes],
  }));
  const [selectedClasses, setSelectedClasses] = useState<string[]>(() => resolveSelectedClassIds(student.classes, classList));
  const [formErrors, setFormErrors] = useState<StudentFormErrors>({});

  useEffect(() => {
    setDraftStudent({
      ...student,
      classes: [...student.classes],
    });
    setSelectedClasses(resolveSelectedClassIds(student.classes, classList));
    setFormErrors({});
  }, [classList, student]);

  const toggleClass = (classId: string) => {
    setSelectedClasses((current) =>
      current.includes(classId) ? current.filter((item) => item !== classId) : [...current, classId],
    );
  };

  const handleDelete = () => {
    Alert.alert('Supprimer', `Supprimer ${studentDisplayName(student)} ? Cette action est irreversible.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { onDeleteStudent?.(student.id); onNavigate('professor-students'); } },
    ]);
  };

  const handleSubmit = () => {
    const nextErrors = validateStudentForm(
      {
        firstName: draftStudent.firstName,
        lastName: draftStudent.lastName,
        matricule: draftStudent.matricule,
        email: draftStudent.email,
        password: draftStudent.password,
      },
      {
        requirePassword: false,
        existingStudents: studentList,
        currentId: student.id,
      },
    );

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const nextClasses = [...selectedClasses];

    onUpdateStudent?.({
      ...draftStudent,
      firstName: draftStudent.firstName.trim(),
      lastName: draftStudent.lastName.trim(),
      matricule: draftStudent.matricule.trim(),
      email: draftStudent.email.trim().toLowerCase(),
      classes: nextClasses,
    });
    onNavigate('professor-student-detail');
  };

  return (
    <ScreenFrame compactHeader scrollable={false} onBack={() => onNavigate('professor-student-detail')} title="Etudiant">
      <View key={student.id} style={styles.editStudentPage}>
        <View style={styles.editStudentFields}>
          <StudentFormField
            label="Prenom *"
            error={formErrors.firstName}
            value={draftStudent.firstName}
            onChangeText={(value) => setDraftStudent((current) => ({ ...current, firstName: value }))}
            autoCapitalize="words"
          />
          <StudentFormField
            label="Nom *"
            error={formErrors.lastName}
            value={draftStudent.lastName}
            onChangeText={(value) => setDraftStudent((current) => ({ ...current, lastName: value }))}
            autoCapitalize="words"
          />
          <StudentFormField
            label="Matricule *"
            error={formErrors.matricule}
            value={draftStudent.matricule}
            onChangeText={(value) => setDraftStudent((current) => ({ ...current, matricule: value }))}
          />
          <StudentFormField
            label="Email *"
            error={formErrors.email}
            value={draftStudent.email}
            onChangeText={(value) => setDraftStudent((current) => ({ ...current, email: value }))}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <StudentFormField
            label="Password"
            error={formErrors.password}
            secureTextEntry
            value={draftStudent.password}
            onChangeText={(value) => setDraftStudent((current) => ({ ...current, password: value }))}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.readonly}>CorrectAI ID: {draftStudent.correctAiId}</Text>
        </View>

        <Card
          icon={Icons.school}
          style={styles.classSelectCard}
          title={`Classes (${selectedClasses.length})`}
          subtitle="Selection multiple">
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
          />
        </Card>

        <View style={styles.dangerActions}>
          <PrimaryButton
            icon={Icons.trash}
            onPress={handleDelete}
            tone="danger"
            variant="soft">
            Supprimer
          </PrimaryButton>
          <FormActions
            onCancel={() => onNavigate('professor-student-detail')}
            onSubmit={handleSubmit}
          />
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  readonly: {
    color: colors.ink,
    fontWeight: '800',
  },
  studentFormFieldGroup: {
    gap: 4,
  },
  studentFormInput: {
    minHeight: 42,
  },
  studentFormInputError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF7F7',
  },
  studentFormError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  editStudentPage: {
    flex: 1,
    minHeight: 0,
    gap: spacing.md,
  },
  editStudentFields: {
    gap: spacing.md,
  },
  dangerActions: {
    gap: spacing.sm,
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
});
