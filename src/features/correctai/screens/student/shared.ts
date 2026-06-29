import { StyleSheet } from 'react-native';

import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, Exam, NavItem, Student } from '@/features/correctai/types';

const { colors, spacing, radius } = correctAiTheme;

export type StudentScreenProps = {
  activeTab: NavItem['id'];
  onNavigate: (screen: AppScreen) => void;
  studentsData: Student[];
  selectedStudent?: Student | null;
  examsData?: Exam[];
  onUpdateStudent?: (student: Student) => void;
};

export { tabPress } from '@/features/correctai/utils';

export const styles = StyleSheet.create({
  resultsCard: { gap: spacing.lg },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  rowSubtitle: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
  resultScore: { color: colors.success, fontSize: 18, fontWeight: '800' },
  resultScoreDanger: { color: colors.danger },
  examCards: { gap: spacing.md },
  pressedCard: { borderRadius: radius.md },
  studentExamCard: { gap: spacing.sm },
  examStatusRow: { alignSelf: 'stretch', alignItems: 'flex-end' },
  bigScoreCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xxl },
  bigScore: { color: colors.primary, fontSize: 56, fontWeight: '800', lineHeight: 62 },
  bigScoreBase: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: -spacing.lg },
  rankText: { color: colors.muted, fontSize: 14, fontWeight: '700', marginTop: spacing.sm },
  questionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  questionChip: { width: '28%', height: 52, borderRadius: radius.sm, backgroundColor: colors.card, justifyContent: 'center' },
  questionText: { color: colors.success, fontSize: 17, fontWeight: '800' },
  questionTextWrong: { color: colors.danger },
  studentName: { color: colors.muted, fontSize: 15, fontWeight: '700', marginTop: -spacing.md },
  reportCard: { gap: spacing.md },
  settingsCard: { gap: spacing.xs },
  reportHeader: { flexDirection: 'row' },
  reportHeaderText: { flex: 1, color: colors.muted, fontSize: 14, fontWeight: '800' },
  reportRow: { flexDirection: 'row', minHeight: 32, alignItems: 'center' },
  reportCell: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' },
  profileHeader: { alignItems: 'center', gap: spacing.xs },
  profileAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: colors.primaryDark, fontSize: 24, fontWeight: '800' },
  profileName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  confirmation: { color: colors.success, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  passwordError: { color: colors.danger, fontSize: 13, fontWeight: '700' },
});
