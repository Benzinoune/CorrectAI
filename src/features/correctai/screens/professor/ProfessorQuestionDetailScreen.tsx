import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, FormActions, Icon, Icons, InfoRow, ScreenFrame } from '@/features/correctai/components/ui';
import { exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import {
  answerSheetChoices,
  formatQuestionAnswers,
  formatQuestionPoints,
  normalizeQuestionAnswers,
  ProfessorScreenProps,
  resolveQuestionBank,
  sortQuestionAnswers,
  styles,
} from './shared';

const { colors, spacing, radius } = correctAiTheme;

function QuestionAnswerPill({
  answer,
  active,
  onPress,
}: {
  answer: string;
  active: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        localStyles.answerToggle,
        active && localStyles.answerToggleActive,
        pressed && styles.pressed,
      ]}>
      <Text style={[localStyles.answerToggleText, active && localStyles.answerToggleTextActive]}>{answer}</Text>
    </Pressable>
  );
}

export function ProfessorQuestionDetailScreen({
  onNavigate,
  onUpdateExam,
  selectedExam,
  selectedQuestionNumber,
}: ProfessorScreenProps) {
  const exam = selectedExam ?? exams[0] ?? null;
  const questionNumber = selectedQuestionNumber ?? 1;
  const questionBank = useMemo(() => resolveQuestionBank(exam), [exam]);
  const question = questionBank.find((item) => item.number === questionNumber) ?? questionBank[0] ?? null;
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(question?.correctAnswers ?? []);
  const [points, setPoints] = useState<number>(question?.points ?? 1);

  useEffect(() => {
    setSelectedAnswers(question?.correctAnswers ?? []);
    setPoints(question?.points ?? 1);
  }, [question?.number, question?.points, question?.correctAnswers]);

  if (!exam || !question) {
    return (
      <ScreenFrame compactHeader scrollable={false} onBack={() => onNavigate('professor-answer-key')} title="Détail question">
        <Card icon={Icons.key} style={styles.listCard} title="Aucune question disponible">
          <Text style={styles.emptyText}>Aucune question n&apos;est disponible pour cette correction.</Text>
        </Card>
      </ScreenFrame>
    );
  }

  const toggleAnswer = (answer: string) => {
    setSelectedAnswers((current) =>
      current.includes(answer) ? current.filter((item) => item !== answer) : sortQuestionAnswers([...current, answer]),
    );
  };

  const saveQuestion = () => {
    const nextQuestionBank = questionBank.map((item) =>
      item.number === question.number
        ? {
            ...item,
            correctAnswers: normalizeQuestionAnswers(selectedAnswers),
            points,
          }
        : item,
    );

    onUpdateExam?.({
      ...exam,
      questionBank: nextQuestionBank,
    });

    onNavigate('professor-answer-key');
  };

  const pointStep = 0.5;

  return (
    <ScreenFrame compactHeader scrollable={false} onBack={() => onNavigate('professor-answer-key')} title={`Question ${question.number}`}>
      <View style={localStyles.answerDetailPage}>
        <Card icon={Icons.key} style={localStyles.answerDetailCard} title="Correction QCM">
          <InfoRow label="Question" value={String(question.number)} />
          <InfoRow label="Points" value={formatQuestionPoints(points)} />
          <InfoRow label="Réponse détectée" value={formatQuestionAnswers(question.detectedAnswers)} />

          <Text style={localStyles.answerDetailHeading}>Choisir la ou les bonnes réponses</Text>
          <View style={localStyles.answerDetailChoicesRow}>
            {answerSheetChoices.map((answer) => (
              <QuestionAnswerPill
                key={answer}
                answer={answer}
                active={selectedAnswers.includes(answer)}
                onPress={() => toggleAnswer(answer)}
              />
            ))}
          </View>

          <View style={localStyles.answerDetailPointBlock}>
            <Text style={localStyles.answerDetailPointLabel}>Valeur de la question</Text>
            <View style={localStyles.answerDetailStepperRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPoints((current) => Math.max(0.5, Math.round((current - pointStep) * 10) / 10))}
                style={({ pressed }) => [localStyles.answerDetailStepperButton, pressed && styles.pressed]}>
                <Icon name={Icons.minus} color={colors.primary} size={18} />
              </Pressable>
              <Text style={localStyles.answerDetailPointsValue}>{points.toFixed(1)}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPoints((current) => Math.round((current + pointStep) * 10) / 10)}
                style={({ pressed }) => [localStyles.answerDetailStepperButton, pressed && styles.pressed]}>
                <Icon name={Icons.plus} color={colors.primary} size={18} />
              </Pressable>
            </View>
          </View>

          <FormActions onCancel={() => onNavigate('professor-answer-key')} onSubmit={saveQuestion} />
        </Card>
      </View>
    </ScreenFrame>
  );
}

const localStyles = StyleSheet.create({
  answerDetailPage: {
    flex: 1,
    minHeight: 0,
  },
  answerDetailCard: {
    gap: spacing.md,
  },
  answerDetailHeading: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  answerDetailChoicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  answerToggle: {
    minWidth: 56,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  answerToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  answerToggleText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  answerToggleTextActive: {
    color: colors.card,
  },
  answerDetailPointBlock: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  answerDetailPointLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  answerDetailStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  answerDetailStepperButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerDetailPointsValue: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 72,
  },
});
