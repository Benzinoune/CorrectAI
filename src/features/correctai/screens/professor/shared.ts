import { Image, StyleSheet, Text, View } from 'react-native';

import { correctAiTheme } from '@/features/correctai/theme';
import type {
  AppScreen,
  ClassRoom,
  Exam,
  ExamQuestion,
  TabId,
  Professor,
  ResponseSheetId,
  ScannedCopy,
  ScannedCopyDraft,
  Student,
  StudentCreateInput,
  Tone,
  UserRole,
} from '@/features/correctai/types';

const { colors, spacing, radius } = correctAiTheme;

export type ProfessorScreenProps = {
  activeTab: TabId;
  onNavigate: (screen: AppScreen) => void;
  selectedStudent?: Student | null;
  selectedClass?: ClassRoom | null;
  selectedExam?: Exam | null;
  selectedQuestionNumber?: number | null;
  selectedScannedCopy?: ScannedCopy | null;
  scannerMode?: 'copies' | 'key';
  onSelectStudent?: (student: Student) => void;
  onSelectClass?: (classItem: ClassRoom) => void;
  onSelectExam?: (exam: Exam) => void;
  onSelectQuestion?: (questionNumber: number) => void;
  onSelectScannedCopy?: (copy: ScannedCopy) => void;
  onSetScannerMode?: (mode: 'copies' | 'key') => void;
  onCreateClass?: (className: string) => void;
  onCreateExam?: (exam: Omit<Exam, 'id'>) => void;
  onCreateStudent?: (student: StudentCreateInput) => void;
  onRegisterExamScan?: (draft?: ScannedCopyDraft) => ScannedCopy | null;
  onRegisterAnswerKeyScan?: () => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onUpdateClass?: (classItem: ClassRoom) => void;
  onDeleteClass?: (classId: string) => void;
  onUpdateExam?: (exam: Exam) => void;
  onDeleteExam?: (examId: string) => void;
  onUpdateProfessor?: (professor: Professor) => void;
  onLogin?: (role: UserRole, establishmentId?: string) => void;
  selectedProfessor?: Professor | null;
  professorsData?: Professor[];
  classesData?: ClassRoom[];
  examsData?: Exam[];
  studentsData?: Student[];
};

import { normalizeSearch, tabPress } from '@/features/correctai/utils';
export { normalizeSearch, tabPress };

export function examTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function formatExamDate(value: Date) {
  return value.toLocaleDateString('fr-FR');
}

export function sortExamsByDate(examList: Exam[], ascending: boolean) {
  return [...examList].sort((a, b) =>
    ascending
      ? examTimestamp(a.date) - examTimestamp(b.date)
      : examTimestamp(b.date) - examTimestamp(a.date),
  );
}

export function scannedCopiesCount(exam?: Exam | null) {
  return exam?.scannedCopies?.length ?? exam?.copies ?? 0;
}

export function formatScannedCopyDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function reviewStatusLabel(status: ScannedCopy['reviewStatus']) {
  switch (status) {
    case 'VALIDATED': return 'Validée';
    case 'CORRECTED': return 'Corrigée';
    case 'DETECTED': return 'Détectée';
    default: return 'À vérifier';
  }
}

export function reviewStatusTone(status: ScannedCopy['reviewStatus']): Tone {
  switch (status) {
    case 'VALIDATED': return 'success';
    case 'CORRECTED': return 'primary';
    default: return 'warning';
  }
}

export function parseDetectedAnswers(value: string) {
  return value.split(/[\n,;]+/).map((part) => part.trim()).filter(Boolean);
}

export function studentDisplayName(student: Student) {
  return `${student.firstName} ${student.lastName}`;
}

export function normalizeClassValue(value: string) {
  return normalizeSearch(value).replace(/\s+/g, '');
}

export function classDisplayName(value: string, classList: ClassRoom[]) {
  const normalizedValue = normalizeClassValue(value);
  return (
    classList.find((classItem) => {
      const normalizedId = normalizeClassValue(classItem.id);
      const normalizedName = normalizeClassValue(classItem.name);
      return value === classItem.id || normalizedValue === normalizedId || normalizedValue === normalizedName;
    })?.name ?? value
  );
}

export function studentClassLabels(student: Student, classList: ClassRoom[]) {
  return student.classes.map((value) => classDisplayName(value, classList));
}

export function classMatchesSelection(assignedValue: string, classItem: ClassRoom) {
  const normalizedAssigned = normalizeClassValue(assignedValue);
  const normalizedId = normalizeClassValue(classItem.id);
  const normalizedName = normalizeClassValue(classItem.name);
  return assignedValue === classItem.id || normalizedAssigned === normalizedId || normalizedAssigned === normalizedName;
}

export function examMatchesClass(exam: Exam, classItem: ClassRoom) {
  if (exam.classIds?.some((classId) => classId === classItem.id)) return true;
  const normalizedClassId = normalizeClassValue(classItem.id);
  const normalizedClassName = normalizeClassValue(classItem.name);
  const normalizedExamClassName = normalizeClassValue(exam.className);
  if (normalizedExamClassName === normalizedClassId || normalizedExamClassName === normalizedClassName) return true;
  return exam.className.split(/[,/|]+/).map((segment) => normalizeClassValue(segment.trim())).filter(Boolean).some((segment) => segment === normalizedClassId || segment === normalizedClassName);
}

export function resolveSelectedClassIds(assignedClasses: string[], classList: ClassRoom[]) {
  return classList.filter((classItem) => assignedClasses.some((value) => classMatchesSelection(value, classItem))).map((classItem) => classItem.id);
}

export function classNamesFromIds(classIds: string[] | undefined, classList: ClassRoom[]) {
  if (!classIds?.length) return [];
  return classIds.map((classId) => classList.find((classItem) => classItem.id === classId)?.name ?? classId);
}

export function formatQuestionPoints(points: number) {
  return `${Number.isInteger(points) ? points.toFixed(0) : points.toFixed(1)} pt${points > 1 ? 's' : ''}`;
}

export function formatScoreValue(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function formatDelimitedClassName(value: string, classList: ClassRoom[]) {
  return value.split(/[,/|]+/).map((part) => part.trim()).filter(Boolean).map((segment) => classDisplayName(segment, classList)).join(', ') || value;
}

export function parseDetectedAnswerToken(value: string | undefined) {
  if (!value) return [];
  const token = value.includes(':') ? value.split(':').pop() ?? value : value;
  return normalizeQuestionAnswers(token.split(/[+]/).map((part) => part.trim()).filter(Boolean));
}

export function formatDetectedAnswerToken(value: string | undefined) {
  const normalized = parseDetectedAnswerToken(value);
  return normalized.length ? sortQuestionAnswers(normalized).join('+') : '—';
}

export function answersMatch(expected: string[] | undefined, actual: string | undefined) {
  const normalizedExpected = sortQuestionAnswers(normalizeQuestionAnswers(expected));
  const normalizedActual = sortQuestionAnswers(parseDetectedAnswerToken(actual));
  if (!normalizedExpected.length && !normalizedActual.length) return false;
  if (normalizedExpected.length !== normalizedActual.length) return false;
  return normalizedExpected.every((answer, index) => answer === normalizedActual[index]);
}

export function formatExamDateForStorage(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatAnswerSheetDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('fr-FR');
}

export function buildDefaultQuestionBank(questionCount: number, defaultPoints = 1): ExamQuestion[] {
  return Array.from({ length: questionCount }, (_, index) => ({
    number: index + 1,
    correctAnswers: [],
    detectedAnswers: [],
    points: defaultPoints,
  }));
}

export function resolveQuestionBank(exam: Exam | null | undefined) {
  if (!exam) return [];
  const currentBank = exam.questionBank ?? [];
  const defaultBank = buildDefaultQuestionBank(exam.questions, currentBank[0]?.points ?? 1);
  return defaultBank.map((question) => {
    const existing = currentBank.find((item) => item.number === question.number);
    return existing ? { ...existing } : question;
  });
}

export function formatQuestionPointsCompact(points: number) {
  return `${Number.isInteger(points) ? points.toFixed(0) : points.toFixed(1)}pt`;
}

export function formatQuestionAnswers(answers: string[] | undefined) {
  const normalized = normalizeQuestionAnswers(answers);
  return normalized.length ? normalized.join('+') : 'À définir';
}

export const answerSheetChoices = ['A', 'B', 'C', 'D', 'E'] as const;

export const answerSheetChoiceOrder = { A: 0, B: 1, C: 2, D: 3, E: 4 } as const;

export const responseSheetOptions = [
  { id: '20' as ResponseSheetId, label: '20 Questions', questions: 20 },
  { id: '50' as ResponseSheetId, label: '50 Questions', questions: 50 },
  { id: '100' as ResponseSheetId, label: '100 Questions', questions: 100 },
] as const;

export function getResponseSheetOption(id: ResponseSheetId) {
  return responseSheetOptions.find((option) => option.id === id) ?? responseSheetOptions[0];
}

export function getResponseSheetOptionFromQuestions(questions: number) {
  return responseSheetOptions.find((option) => option.questions === questions) ?? responseSheetOptions[0];
}

export const answerSheetLayouts: Record<number, { questionHeaderWidth: number; questionHeaderFontSize: number; bubbleHeaderFontSize: number; questionRowMinHeight: number; rowGap: number; questionNumberWidth: number; questionNumberFontSize: number; bubbleSize: number; bubbleBorderWidth: number }> = {
  20: { questionHeaderWidth: 38, questionHeaderFontSize: 12, bubbleHeaderFontSize: 12, questionRowMinHeight: 30, rowGap: 3, questionNumberWidth: 30, questionNumberFontSize: 11, bubbleSize: 26, bubbleBorderWidth: 2 },
  50: { questionHeaderWidth: 36, questionHeaderFontSize: 10, bubbleHeaderFontSize: 10, questionRowMinHeight: 26, rowGap: 2, questionNumberWidth: 28, questionNumberFontSize: 10, bubbleSize: 22, bubbleBorderWidth: 2 },
  100: { questionHeaderWidth: 34, questionHeaderFontSize: 9, bubbleHeaderFontSize: 9, questionRowMinHeight: 22, rowGap: 1, questionNumberWidth: 26, questionNumberFontSize: 9, bubbleSize: 18, bubbleBorderWidth: 1 },
};

export function normalizeQuestionAnswers(answers: string[] | undefined) {
  if (!answers?.length) return [];
  return answerSheetChoices.filter((choice) => answers.includes(choice));
}

export function sortQuestionAnswers(answers: string[]) {
  return [...answers].sort((left, right) => answerSheetChoiceOrder[left as keyof typeof answerSheetChoiceOrder] - answerSheetChoiceOrder[right as keyof typeof answerSheetChoiceOrder]);
}

export function getAnswerSheetLayout(questionCount: number) {
  if (questionCount >= 100) return answerSheetLayouts[100];
  if (questionCount >= 50) return answerSheetLayouts[50];
  return answerSheetLayouts[20];
}

type CopyCorrectionRow = {
  number: number;
  correctAnswer: string;
  studentAnswer: string;
  pointsEarned: number;
  points: number;
};

type CopyCorrectionSummary = {
  rows: CopyCorrectionRow[];
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  reviewedAt: string;
};

export function buildCopyCorrectionSummary(exam: Exam, copy: ScannedCopy): CopyCorrectionSummary {
  const questionBank = resolveQuestionBank(exam);
  const rows = questionBank.map((question, index) => {
    const studentToken = copy.detectedAnswers[index];
    const correctAnswer = formatQuestionAnswers(question.correctAnswers);
    const studentAnswer = formatDetectedAnswerToken(studentToken);
    const isCorrect = answersMatch(question.correctAnswers, studentToken);
    return {
      number: question.number,
      correctAnswer,
      studentAnswer,
      pointsEarned: isCorrect ? question.points : 0,
      points: question.points,
    };
  });
  const totalPoints = rows.reduce((sum, row) => sum + row.pointsEarned, 0);
  const maxPoints = rows.reduce((sum, row) => sum + row.points, 0);
  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  const reviewedAt = copy.metadata?.reviewedAt ?? copy.metadata?.processedAt ?? copy.scannedAt;
  return { rows, totalPoints, maxPoints, percentage, reviewedAt };
}

export type StudentFormValues = {
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  password: string;
};

export type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>;

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStudentForm(
  values: StudentFormValues,
  options?: { requirePassword?: boolean; existingStudents?: { matricule: string; email: string; id?: string }[]; currentId?: string },
) {
  const errors: StudentFormErrors = {};
  const { requirePassword = true, existingStudents = [], currentId } = options ?? {};

  if (!values.firstName.trim()) {
    errors.firstName = 'Le prénom est requis.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Le nom est requis.';
  }

  if (!values.matricule.trim()) {
    errors.matricule = 'Le matricule est requis.';
  } else if (existingStudents.some((s) => s.matricule === values.matricule.trim() && s.id !== currentId)) {
    errors.matricule = 'Ce matricule existe déjà.';
  }

  if (!values.email.trim()) {
    errors.email = 'L\'email est requis.';
  } else if (!emailPattern.test(values.email.trim().toLowerCase())) {
    errors.email = 'Entrez une adresse email valide.';
  } else if (existingStudents.some((s) => s.email.toLowerCase() === values.email.trim().toLowerCase() && s.id !== currentId)) {
    errors.email = 'Cet email existe déjà.';
  }

  if (requirePassword && !values.password.trim()) {
    errors.password = 'Le mot de passe est requis.';
  } else if (values.password.trim() && values.password.trim().length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères.';
  }

  return errors;
}

export const styles = StyleSheet.create({
  // Exam cards
  examCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  examCardLeft: {
    gap: spacing.xxs,
    flex: 1,
  },
  examCardName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  examCardDate: {
    color: colors.muted,
    fontSize: 13,
  },
  examCardRight: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  examActionButton: {
    alignSelf: 'flex-end',
  },
  examFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  examFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.neutralSoft,
  },
  examFilterChipActive: {
    backgroundColor: colors.primary,
  },
  examFilterText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  examFilterTextActive: {
    color: colors.card,
  },
  examMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  examMetaLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  examList: {
    gap: spacing.sm,
  },

  // Card & layout
  pressed: { opacity: 0.72 },
  emptyCard: { width: '100%', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  page: { flex: 1 },
  listView: { flex: 1 },
  list: { paddingBottom: 100, gap: spacing.md },
  listEmpty: { flexGrow: 1, justifyContent: 'flex-start' },
  header: { gap: spacing.md, marginBottom: spacing.xs },
  fabWrap: { position: 'absolute', right: spacing.md },
  fabButton: { marginTop: 0 },
  noMargin: { marginTop: 0 },

  // Home
  homeStatsRow: { flexDirection: 'row', gap: spacing.sm },
  homeStatCard: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg, minWidth: 0 },
  homeStatValue: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  homeStatLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // Students
  studentCardPressable: { borderRadius: radius.lg },
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
  studentCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentHeaderText: { flex: 1, gap: 2 },
  studentSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  studentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  studentMetaText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  studentClasses: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  studentData: { flex: 1, gap: 2 },
  studentName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  studentMatricule: { color: colors.muted, fontSize: 13 },
  studentClassLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },

  // Student detail
  studentDetailCard: { gap: spacing.sm },
  studentInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentInfoLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  studentInfoValue: { color: colors.ink, fontSize: 14, fontWeight: '800' },

  // Student edit
  studentForm: { gap: spacing.md },
  studentFormFieldGroup: { gap: spacing.xxs },
  studentFormInput: { marginBottom: 0 },
  studentFormInputError: { borderColor: colors.danger },
  studentFormError: { color: colors.danger, fontSize: 12, fontWeight: '700' },

  // Classes
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  classData: { gap: 2, flex: 1 },
  className: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  classMetaText: { color: colors.muted, fontSize: 13 },

  // Class detail
  classPageTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: spacing.md },
  classDetailList: { gap: spacing.md },
  classDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // New exam
  newExamForm: { gap: spacing.md },
  newExamCard: { gap: spacing.sm },
  newExamRow: { flexDirection: 'row', gap: spacing.sm },
  newExamFieldHalf: { flex: 1, gap: spacing.xs },
  newExamHint: { color: colors.muted, fontSize: 14, lineHeight: 20 },

  // Exam menu
  examMenuHeader: { gap: spacing.sm },
  examMenuTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  examMenuBadgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  examMenuActions: { gap: spacing.sm },

  // Answer sheet
  answerSheetPage: { gap: spacing.md },
  answerSheetCard: { gap: spacing.md },
  answerSheetColumn: { flex: 1, gap: 1 },
  answerSheetColumnHeader: { flexDirection: 'row', alignItems: 'center' },
  answerSheetQuestionHeader: { fontWeight: '800', textAlign: 'center', color: colors.ink },
  answerSheetBubbleHeader: { flex: 1, fontWeight: '800', textAlign: 'center', color: colors.muted },
  answerSheetQuestionRow: { flexDirection: 'row', alignItems: 'center' },
  answerSheetQuestionNumber: { fontWeight: '700', textAlign: 'center', color: colors.muted },
  answerSheetBubbles: { flexDirection: 'row', flex: 1 },
  answerSheetBubble: { borderRadius: 99, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  answerSheetBubbleSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  answerSheetFormField: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm },
  answerSheetFormLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', minWidth: 36 },
  answerSheetFormValueLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: colors.faint, paddingVertical: 4 },
  answerSheetFormValue: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  answerSheetActionButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
  answerSheetActionButtonSolid: { backgroundColor: colors.primary },
  answerSheetActionButtonOutline: { borderWidth: 1, borderColor: colors.primary },
  answerSheetActionLabelSolid: { color: colors.card, fontSize: 13, fontWeight: '800' },
  answerSheetActionLabel: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  answerSheetMetaRow: { flexDirection: 'row', gap: spacing.md },
  answerSheetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  // Correction
  correctionList: { gap: spacing.md },
  correctionQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  correctionQuestionLeft: { flex: 1, gap: 2 },
  correctionQuestionRight: { alignItems: 'flex-end', gap: spacing.xxs },
  correctionQuestionAction: { padding: spacing.xs },
  correctionKeyLabel: { color: colors.muted, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  correctionScannerButtonWrap: { marginTop: spacing.sm, marginBottom: spacing.md },

  // Copy review
  reviewCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewCopyLeft: { flex: 1, gap: spacing.xxs },
  reviewCopyName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  reviewCopyMeta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  reviewCopyCountWrap: { alignItems: 'center' },
  reviewCopyCountLabel: { fontSize: 16, fontWeight: '800' },
  reviewListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },

  // Profile
  profileCard: { gap: spacing.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileAvatarSection: { alignItems: 'center' },
  profileMeta: { flex: 1, minWidth: 0, gap: 3 },
  profileName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  profileEmail: { color: colors.muted, fontSize: 13 },
  profileStatus: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  profileStats: { gap: spacing.sm },
  editForm: { gap: spacing.md },
  editModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  modalInput: { marginBottom: spacing.sm },
  modalError: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  modalTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginBottom: spacing.xs },

  // General form
  formTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  formHint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  formError: { color: colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  row: { flexDirection: 'row', gap: spacing.sm },
  fieldHalf: { flex: 1, minWidth: 0 },
  pickerWrap: { gap: spacing.xs },
  pickerLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  pickerOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pickerChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.neutralSoft, borderWidth: 1, borderColor: colors.border },
  pickerChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pickerChipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  pickerChipTextActive: { color: colors.primary },
  actions: { gap: spacing.sm },
  fabContainer: { marginTop: spacing.lg },

  // Misc shared
  statusRow: { gap: spacing.xs },
  sectionHint: { color: colors.muted, fontSize: 14, marginBottom: spacing.sm, marginTop: -spacing.sm },
  listCard: { gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  metaLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  adminCard: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  adminInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  adminName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  adminEmail: { color: colors.muted, fontSize: 13 },

  // Professor home
  profChartCard: { gap: spacing.sm },
  profLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  profLegendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  profLegendDot: { width: 10, height: 10, borderRadius: 5 },
  profLegendLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  profMetricsRow: { flexDirection: 'row', gap: spacing.sm },
  profMetricBox: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.neutralSoft },
  profMetricValue: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  profMetricLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  profQuickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  profQuickCard: {
    width: '47%', flexGrow: 1, flexBasis: '45%', minHeight: 96, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card, padding: spacing.md, gap: spacing.sm,
    shadowColor: '#1F2440', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  profQuickIcon: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  profQuickText: { gap: 2 },
  profQuickLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  profQuickDesc: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
