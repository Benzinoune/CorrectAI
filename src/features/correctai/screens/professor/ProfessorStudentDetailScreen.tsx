import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar, Card, EmptyGap, Icons, InfoRow, PrimaryButton, ScreenFrame } from '@/features/correctai/components/ui';
import { classes, students } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import { ProfessorScreenProps, studentClassLabels, studentDisplayName } from './shared';

const { colors, radius, spacing } = correctAiTheme;

const styles = StyleSheet.create({
  studentDetailHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  studentDetailHeroText: {
    flex: 1,
    gap: spacing.xxs,
  },
  studentDetailName: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  studentDetailMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  studentDetailCard: {
    gap: spacing.sm,
  },
  studentDetailNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  studentDetailChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  studentDetailChip: {
    minHeight: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  studentDetailChipText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
});

export function ProfessorStudentDetailScreen({
  onNavigate,
  onDeleteStudent,
  selectedStudent,
  classesData,
  studentsData,
}: ProfessorScreenProps) {
  const classList = classesData ?? classes;
  const studentList = studentsData ?? students;
  const student =
    studentList.find((item) => item.id === selectedStudent?.id) ?? selectedStudent ?? studentList[0] ?? students[0];
  const classLabels = studentClassLabels(student, classList);

  const handleDelete = () => {
    Alert.alert('Supprimer', `Supprimer ${studentDisplayName(student)} ? Cette action est irreversible.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { onDeleteStudent?.(student.id); onNavigate('professor-students'); } },
    ]);
  };

  return (
    <ScreenFrame
      compactHeader
      onBack={() => onNavigate('professor-students')}
      rightAction={{ icon: Icons.edit, onPress: () => onNavigate('professor-student-edit') }}
      title="Etudiant">
      <View style={styles.studentDetailHero}>
        <Avatar initials={student.initials} size={72} />
        <View style={styles.studentDetailHeroText}>
          <Text style={styles.studentDetailName}>{studentDisplayName(student)}</Text>
          <Text style={styles.studentDetailMeta}>Matricule {student.matricule}</Text>
          <Text style={styles.studentDetailMeta}>CorrectAI ID {student.correctAiId}</Text>
        </View>
      </View>

      <Card icon={Icons.profile} style={styles.studentDetailCard} title="Informations personnelles">
        <InfoRow label="Prenom" value={student.firstName} />
        <InfoRow label="Nom" value={student.lastName} />
        <InfoRow label="Initiales" value={student.initials} />
        <InfoRow label="Matricule" value={student.matricule} />
        <InfoRow label="Email" value={student.email} />
      </Card>

      <Card icon={Icons.school} style={styles.studentDetailCard} title="Informations academiques">
        <InfoRow label="Classes" value={`${student.classes.length} classe(s)`} />
        <View style={styles.studentDetailChips}>
          {classLabels.map((className, index) => (
            <View key={`${className}-${index}`} style={styles.studentDetailChip}>
              <Text style={styles.studentDetailChipText}>{className}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card icon={Icons.key} style={styles.studentDetailCard} title="Identifiants">
        <InfoRow label="CorrectAI ID" value={student.correctAiId} />
        <InfoRow label="Reference externe" value={student.matricule} />
        <Text style={styles.studentDetailNote}>Ici, la reference externe correspond au matricule.</Text>
      </Card>

      <PrimaryButton icon={Icons.trash} onPress={handleDelete} tone="danger" variant="soft">
        SUPPRIMER L&apos;ETUDIANT
      </PrimaryButton>
      <EmptyGap />
    </ScreenFrame>
  );
}
