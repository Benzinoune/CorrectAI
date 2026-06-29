import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card, Icon, Icons, PrimaryButton, ScreenFrame } from '@/features/correctai/components/ui';
import { exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { Exam, ExamQuestion } from '@/features/correctai/types';
import {
  answerSheetChoices,
  formatQuestionPointsCompact,
  normalizeQuestionAnswers,
  ProfessorScreenProps,
  resolveQuestionBank,
} from './shared';

const { colors, spacing, radius } = correctAiTheme;

function QuestionPointsModal({
  visible,
  initialValue,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  initialValue: number;
  onCancel: () => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  const changeValue = (delta: number) => {
    setValue((current) => Math.max(0.5, Math.round((current + delta) * 10) / 10));
  };

  const presets = [0.5, 1, 2, 5];

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.pointsModalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.pointsModalCard}>
          <View style={styles.pointsModalHeader}>
            <View style={styles.pointsModalHeaderIcon}>
              <Icon name={Icons.star} color={colors.primary} size={18} />
            </View>
            <View style={styles.pointsModalHeaderText}>
              <Text style={styles.pointsModalTitle}>Modifier les points de toutes les questions</Text>
              <Text style={styles.pointsModalSubtitle}>
                Cette action s&apos;applique à toutes les questions
              </Text>
            </View>
          </View>

          <View style={styles.pointsModalBody}>
            <Text style={styles.pointsModalLabel}>VALEUR DE POINTS - BONNE RÉPONSE</Text>
            <View style={styles.pointsStepperRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => changeValue(-0.5)}
                style={({ pressed }) => [styles.pointsStepperButton, pressed && styles.pressed]}>
                <Icon name={Icons.minus} color={colors.primary} size={18} />
              </Pressable>
              <View style={styles.pointsValueBlock}>
                <Text style={styles.pointsValue}>{value.toFixed(1)}</Text>
                <Text style={styles.pointsValueCaption}>POINT(S) / QUESTION</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => changeValue(0.5)}
                style={({ pressed }) => [styles.pointsStepperButton, pressed && styles.pressed]}>
                <Icon name={Icons.plus} color={colors.primary} size={18} />
              </Pressable>
            </View>

            <View style={styles.pointsPresetsRow}>
              {presets.map((preset) => {
                const active = value === preset;
                return (
                  <Pressable
                    key={preset}
                    accessibilityRole="button"
                    onPress={() => setValue(preset)}
                    style={({ pressed }) => [
                      styles.pointsPreset,
                      active && styles.pointsPresetActive,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.pointsPresetValue, active && styles.pointsPresetValueActive]}>
                      {preset.toFixed(preset === 1 ? 0 : 1)}
                    </Text>
                    <Text style={[styles.pointsPresetLabel, active && styles.pointsPresetValueActive]}>
                      {`${preset.toFixed(preset === 1 ? 0 : 1)} pt${preset > 1 ? 's' : ''}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pointsNote}>
              <Icon name={Icons.info} color={colors.primary} size={14} />
              <Text style={styles.pointsNoteText}>
                Cette valeur sera appliquée à toutes les questions. Vous pourrez ajuster chaque question
                individuellement ensuite.
              </Text>
            </View>
          </View>

          <View style={styles.pointsModalFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.pointsModalFooterButton, styles.pointsModalFooterCancel, pressed && styles.pressed]}>
              <Text style={styles.pointsModalFooterCancelText}>Annuler</Text>
            </Pressable>
            <View style={styles.pointsModalFooterDivider} />
            <Pressable
              accessibilityRole="button"
              onPress={() => onConfirm(value)}
              style={({ pressed }) => [styles.pointsModalFooterButton, styles.pointsModalFooterSave, pressed && styles.pressed]}>
              <Text style={styles.pointsModalFooterSaveText}>Enregistrer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CorrectionQuestionRow({
  item,
  onPress,
}: {
  item: ExamQuestion;
  onPress: () => void;
}) {
  const activeAnswers = normalizeQuestionAnswers(item.correctAnswers);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.correctionQuestionRow, pressed && styles.pressed]}>
      <View style={styles.correctionQuestionBadge}>
        <Text style={styles.correctionQuestionBadgeText}>{item.number}</Text>
      </View>
      <View style={styles.correctionQuestionChoices}>
        {answerSheetChoices.map((choice) => {
          const active = activeAnswers.includes(choice);

          return (
            <View key={choice} style={[styles.correctionQuestionChoice, active && styles.correctionQuestionChoiceActive]}>
              <Text style={[styles.correctionQuestionChoiceText, active && styles.correctionQuestionChoiceTextActive]}>
                {choice}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.correctionQuestionPoints}>{formatQuestionPointsCompact(item.points)}</Text>
      <View style={styles.correctionQuestionAction}>
        <Icon name={Icons.info} color={colors.muted} size={16} />
      </View>
    </Pressable>
  );
}

export function ProfessorAnswerKeyScreen({
  onNavigate,
  onSelectQuestion,
  onUpdateExam,
  onSetScannerMode,
  selectedExam,
}: ProfessorScreenProps) {
  const exam = selectedExam ?? exams[0] ?? null;
  const [pointsModalVisible, setPointsModalVisible] = useState(false);

  const questionBank = useMemo(() => resolveQuestionBank(exam), [exam]);
  const commonPoints = questionBank[0]?.points ?? 1;

  if (!exam) {
    return (
      <ScreenFrame compactHeader scrollable={false} onBack={() => onNavigate('professor-exam-menu')} title="Corrigé QCM">
        <Card icon={Icons.key} style={styles.listCard} title="Aucun examen disponible">
          <Text style={styles.emptyText}>Ajoutez un examen pour commencer la correction.</Text>
        </Card>
      </ScreenFrame>
    );
  }

  const applyGlobalPoints = (points: number) => {
    const nextExam: Exam = {
      ...exam,
      questionBank: questionBank.map((question) => ({
        ...question,
        points,
      })),
    };

    onUpdateExam?.(nextExam);
    setPointsModalVisible(false);
  };

  return (
    <ScreenFrame
      compactHeader
      scrollable={false}
      onBack={() => onNavigate('professor-exam-menu')}
      rightAction={{ icon: Icons.gear, onPress: () => setPointsModalVisible(true) }}
      title="Corrigé QCM">
      <View style={styles.correctionPage}>
        <Text style={styles.nameLine}>
          Name : <Text style={styles.nameAccent}>{exam.name}</Text>
        </Text>
        <Text style={styles.correctionKeyLabel}>A : PRINCIPAL</Text>

        <View style={styles.correctionScannerButtonWrap}>
          <PrimaryButton
            icon={Icons.camera}
            onPress={() => {
              onSetScannerMode?.('key');
              onNavigate('professor-scanner');
            }}
            style={styles.correctionScannerButton}
            tone="success">
            SCANNER CLE
          </PrimaryButton>
        </View>

        <FlatList
          data={questionBank}
          keyExtractor={(item) => String(item.number)}
          renderItem={({ item }) => (
            <CorrectionQuestionRow
              item={item}
              onPress={() => {
                onSelectQuestion?.(item.number);
                onNavigate('professor-answer-detail');
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.correctionList}
          contentContainerStyle={styles.correctionListContent}
          ItemSeparatorComponent={() => <View style={styles.correctionListSeparator} />}
        />
      </View>

      <QuestionPointsModal
        initialValue={commonPoints}
        onCancel={() => setPointsModalVisible(false)}
        onConfirm={applyGlobalPoints}
        visible={pointsModalVisible}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.72,
  },
  listCard: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  nameLine: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  nameAccent: {
    color: '#13935E',
  },
  correctionPage: {
    flex: 1,
    minHeight: 0,
    gap: spacing.sm,
  },
  correctionKeyLabel: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginTop: -2,
  },
  correctionScannerButtonWrap: {
    alignItems: 'flex-start',
  },
  correctionScannerButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    shadowColor: '#0CBB86',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  correctionList: {
    flex: 1,
    minHeight: 0,
  },
  correctionListContent: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  correctionListSeparator: {
    height: 0,
  },
  correctionQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E5F0',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#1F2440',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  correctionQuestionBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctionQuestionBadgeText: {
    color: colors.card,
    fontSize: 13,
    fontWeight: '800',
  },
  correctionQuestionChoices: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.xs,
  },
  correctionQuestionChoice: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E8EAF3',
    backgroundColor: '#F7F8FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctionQuestionChoiceActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.24,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  correctionQuestionChoiceText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  correctionQuestionChoiceTextActive: {
    color: colors.card,
  },
  correctionQuestionPoints: {
    minWidth: 34,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },
  correctionQuestionAction: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E5F0',
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 16, 35, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  pointsModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: colors.card,
    overflow: 'hidden',
    shadowColor: '#1F2440',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  pointsModalHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pointsModalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsModalHeaderText: {
    flex: 1,
    gap: 2,
  },
  pointsModalTitle: {
    color: colors.card,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  pointsModalSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  pointsModalBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  pointsModalLabel: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pointsStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pointsStepperButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsValueBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  pointsValue: {
    color: colors.ink,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  pointsValueCaption: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pointsPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pointsPreset: {
    flexGrow: 1,
    flexBasis: '22%',
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  pointsPresetActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pointsPresetValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  pointsPresetValueActive: {
    color: colors.primary,
  },
  pointsPresetLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  pointsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E8F6',
    backgroundColor: '#F7F8FD',
    padding: spacing.md,
  },
  pointsNoteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  pointsModalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pointsModalFooterButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  pointsModalFooterDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  pointsModalFooterCancel: {},
  pointsModalFooterSave: {},
  pointsModalFooterCancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  pointsModalFooterSaveText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
});
