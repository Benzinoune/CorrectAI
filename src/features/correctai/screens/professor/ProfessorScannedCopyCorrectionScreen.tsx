import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon, Icons, PrimaryButton, ScreenFrame, StatusPill, TextButton } from '@/features/correctai/components/ui';
import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, ClassRoom, Exam, ScannedCopy } from '@/features/correctai/types';
import { answerSheetChoices, reviewStatusTone } from './shared';

const { colors, radius, spacing } = correctAiTheme;

type RevisionStatus = 'correct' | 'wrong' | 'modified' | 'unanswered';

type Props = {
  onNavigate: (screen: AppScreen) => void;
  onSelectScannedCopy?: (copy: ScannedCopy | null) => void;
  onUpdateExam?: (exam: Exam) => void;
  classesData?: ClassRoom[];
  selectedExam?: Exam | null;
  selectedScannedCopy?: ScannedCopy | null;
};

function parseAnswerToken(value: string | undefined) {
  if (!value) return [];
  const token = value.includes(':') ? value.split(':').pop() ?? value : value;
  return token
    .split(/[+]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function reviewStatusLabel(status: ScannedCopy['reviewStatus']) {
  switch (status) {
    case 'VALIDATED': return 'Validée';
    case 'CORRECTED': return 'Corrigée';
    default: return 'Détectée';
  }
}

function calculateScore(
  detected: string[],
  questionBank: Exam['questionBank'],
) {
  const bank = questionBank ?? [];
  let score = 0;
  const max = bank.reduce((sum, q) => sum + q.points, 0);
  const rows = bank.map((q, i) => {
    const studentToken = detected[i];
    const studentAnswers = parseAnswerToken(studentToken);
    const sortedStudent = [...studentAnswers].sort();
    const sortedCorrect = [...(q.correctAnswers ?? [])].sort();
    const isCorrect =
      sortedStudent.length > 0 &&
      sortedCorrect.length > 0 &&
      sortedStudent.length === sortedCorrect.length &&
      sortedStudent.every((a, idx) => a === sortedCorrect[idx]);
    if (isCorrect) score += q.points;
    return {
      number: q.number,
      status: (isCorrect ? 'correct' : sortedStudent.length === 0 ? 'unanswered' : 'wrong') as RevisionStatus,
      correct: sortedCorrect.join('+') || '—',
      student: sortedStudent.join('+') || '—',
    };
  });
  return { score, max, rows };
}

export function ProfessorScannedCopyCorrectionScreen({
  onNavigate,
  onSelectScannedCopy,
  onUpdateExam,
  classesData,
  selectedExam,
  selectedScannedCopy,
}: Props) {
  const windowWidth = Dimensions.get('window').width;
  const isLargeScreen = windowWidth >= 768;

  const exam = selectedExam;
  const copy = selectedScannedCopy;
  const classList = classesData ?? [];

  const questionBank = useMemo(() => {
    if (!exam?.questionBank?.length) return [];
    return exam.questionBank;
  }, [exam]);

  const [localAnswers, setLocalAnswers] = useState<string[]>(() => copy?.detectedAnswers ?? []);
  const [modifiedQuestions, setModifiedQuestions] = useState<Set<number>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'validated'>('idle');
  const [zoom, setZoom] = useState(1);

  const scrollRef = useRef<ScrollView>(null);

  const summary = useMemo(() => calculateScore(localAnswers, questionBank), [localAnswers, questionBank]);

  const scoreText = `${summary.score}/${summary.max}`;

  const handleAnswerPress = (questionNumber: number, choice: string) => {
    setLocalAnswers((current) => {
      const next = [...current];
      const existing = parseAnswerToken(next[questionNumber - 1]);
      const idx = existing.indexOf(choice);
      let updated: string[];
      if (idx >= 0) {
        updated = existing.filter((a) => a !== choice);
      } else {
        updated = [...existing, choice].sort();
      }
      next[questionNumber - 1] = updated.length > 0 ? updated.join('+') : '';
      return next;
    });
    setModifiedQuestions((prev) => new Set(prev).add(questionNumber));
    setSaveStatus('idle');
  };

  const handleSelectQuestion = (questionNumber: number) => {
    setSelectedQuestion(questionNumber);
  };

  const handleSave = () => {
    if (!copy || !exam) return;
    const nextCopy: ScannedCopy = {
      ...copy,
      detectedAnswers: localAnswers,
      detectedAnswersCount: localAnswers.filter((a) => a.trim()).length,
      reviewStatus: 'CORRECTED',
      calculatedScore: scoreText,
      metadata: {
        ...copy.metadata,
        source: 'scanner',
        processedAt: copy.metadata?.processedAt ?? copy.scannedAt,
        reviewedAt: new Date().toISOString(),
      },
    };
    const nextCopies = (exam.scannedCopies ?? []).map((c) => (c.id === copy.id ? nextCopy : c));
    onUpdateExam?.({ ...exam, scannedCopies: nextCopies, copies: nextCopies.length });
    onSelectScannedCopy?.(nextCopy);
    setSaveStatus('saved');
  };

  const handleValidate = () => {
    handleSave();
    setSaveStatus('validated');
    setTimeout(() => onNavigate('professor-review-copies'), 400);
  };

  const handleCancel = () => {
    onNavigate('professor-review-copies');
  };

  function questionStatus(qNumber: number): RevisionStatus {
    const row = summary.rows.find((r) => r.number === qNumber);
    if (modifiedQuestions.has(qNumber)) return 'modified';
    return row?.status ?? 'unanswered';
  }

  function statusColors(status: RevisionStatus) {
    switch (status) {
      case 'correct': return { bg: colors.successSoft, text: colors.success, border: colors.success };
      case 'wrong': return { bg: colors.dangerSoft, text: colors.danger, border: colors.danger };
      case 'modified': return { bg: colors.warningSoft, text: '#8E5600', border: colors.warning };
      default: return { bg: colors.neutralSoft, text: colors.neutralText, border: colors.border };
    }
  }

  if (!exam || !copy) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-review-copies')} title="Révision de la copie">
        <View style={styles.emptyContainer}>
          <Icon name={Icons.info} color={colors.muted} size={32} />
          <Text style={styles.emptyText}>Aucune copie sélectionnée</Text>
        </View>
      </ScreenFrame>
    );
  }

  const studentInfo = copy;

  const renderStudentCard = () => (
    <View style={styles.studentCard}>
      <View style={styles.studentCardHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {(studentInfo.studentName || '??').split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2)}
          </Text>
        </View>
        <View style={styles.studentInfoBlock}>
          <Text style={styles.studentName}>{studentInfo.studentName || 'Non identifié'}</Text>
          <Text style={styles.studentMeta}>Matricule : {studentInfo.matricule || '—'}</Text>
          <Text style={styles.studentMeta}>
            {studentInfo.className || '—'} · {studentInfo.examName}
          </Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeValue}>{scoreText}</Text>
          {modifiedQuestions.size > 0 ? (
            <StatusPill label="Modifiée" tone="warning" />
          ) : saveStatus === 'validated' ? (
            <StatusPill label="Validée" tone="success" />
          ) : (
            <StatusPill label={reviewStatusLabel(copy.reviewStatus)} tone={reviewStatusTone(copy.reviewStatus)} />
          )}
        </View>
      </View>
    </View>
  );

  const renderImageSection = () => (
    <View style={styles.imageSection}>
      <View style={styles.imageSectionHeader}>
        <Text style={styles.sectionLabel}>Feuille de réponses scannée</Text>
        {Platform.OS !== 'ios' && (
          <View style={styles.zoomControls}>
            <Pressable
              onPress={() => setZoom((z) => Math.max(1, z - 0.25))}
              style={({ pressed }) => [styles.zoomBtn, pressed && styles.pressed]}
            >
              <Icon name={Icons.minus} color={colors.primary} size={16} />
            </Pressable>
            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            <Pressable
              onPress={() => setZoom((z) => Math.min(3, z + 0.25))}
              style={({ pressed }) => [styles.zoomBtn, pressed && styles.pressed]}
            >
              <Icon name={Icons.plus} color={colors.primary} size={16} />
            </Pressable>
          </View>
        )}
      </View>
      <ScrollView
        bouncesZoom
        contentContainerStyle={styles.imageScrollContent}
        maximumZoomScale={3}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.imageScroll}
      >
        <View style={[styles.imageWrapper, { transform: Platform.OS !== 'ios' ? [{ scale: zoom }] : [] }]}>
          {copy.imageUri ? (
            <Image source={{ uri: copy.imageUri }} resizeMode="contain" style={styles.scannedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name={Icons.camera} color={colors.faint} size={40} />
              <Text style={styles.imagePlaceholderText}>Aucune image scannée</Text>
            </View>
          )}
          {selectedQuestion && (
            <View style={styles.questionOverlay}>
              {(() => {
                const qIdx = selectedQuestion - 1;
                const qTotal = questionBank.length || exam.questions;
                const cols = qTotal >= 100 ? 4 : qTotal >= 50 ? 3 : 2;
                const perCol = Math.ceil(qTotal / cols);
                const colIdx = Math.floor(qIdx / perCol);
                const rowIdx = qIdx % perCol;
                const colWidth = 100 / cols;
                const rowHeight = 100 / perCol;
                return (
                  <View
                    style={[
                      styles.questionHighlight,
                      {
                        left: `${colIdx * colWidth}%`,
                        top: `${rowIdx * rowHeight}%`,
                        width: `${colWidth}%`,
                        height: `${rowHeight}%`,
                      },
                    ]}
                  />
                );
              })()}
            </View>
          )}
        </View>
      </ScrollView>
      {zoom > 1 && <Text style={styles.zoomHint}>Déplacez-vous dans l'image pour voir les détails</Text>}
    </View>
  );

  const renderAnswerList = () => (
    <View style={styles.answerListSection}>
      <Text style={styles.sectionLabel}>
        Réponses · {summary.score}/{summary.max} ({Math.round((summary.score / Math.max(summary.max, 1)) * 100)}%)
      </Text>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.answerListScroll}
      >
        <View style={styles.answerGrid}>
          {summary.rows.map((row) => {
            const status = questionStatus(row.number);
            const sc = statusColors(status);
            const isSelected = selectedQuestion === row.number;
            return (
              <Pressable
                key={row.number}
                onPress={() => handleSelectQuestion(row.number)}
                style={[
                  styles.answerQuestionCard,
                  isSelected && styles.answerQuestionCardSelected,
                  { borderLeftColor: sc.border },
                ]}
              >
                <View style={styles.answerQuestionHeader}>
                  <View style={[styles.answerQuestionDot, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[styles.answerQuestionNumber, { color: sc.text }]}>{row.number}</Text>
                  </View>
                  {modifiedQuestions.has(row.number) && <StatusPill label="Modifiée" tone="warning" />}
                  {!modifiedQuestions.has(row.number) && row.status === 'correct' && <StatusPill label="Correcte" tone="success" />}
                  {!modifiedQuestions.has(row.number) && row.status === 'wrong' && <StatusPill label="Fausse" tone="danger" />}
                  {!modifiedQuestions.has(row.number) && row.status === 'unanswered' && <StatusPill label="Vide" tone="neutral" />}
                </View>
                <View style={styles.answerBubbleRow}>
                  {answerSheetChoices.map((choice) => {
                    const answers = parseAnswerToken(localAnswers[row.number - 1]);
                    const isActive = answers.includes(choice);
                    const bc = isActive ? sc : statusColors('unanswered');
                    return (
                      <Pressable
                        key={choice}
                        onPress={() => handleAnswerPress(row.number, choice)}
                        style={({ pressed }) => [
                          styles.answerBubble,
                          {
                            backgroundColor: isActive ? bc.text : colors.card,
                            borderColor: isActive ? bc.text : colors.border,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.answerBubbleText, { color: isActive ? colors.card : colors.muted }]}>
                          {choice}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.answerQuestionFooter}>
                  <Text style={styles.answerPointsText}>
                    {row.correct !== '—' ? `Corrigé : ${row.correct}` : 'Non défini'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderBottomActions = () => (
    <View style={styles.bottomActions}>
      <TextButton icon={Icons.close} onPress={handleCancel} tone="neutral">
        Annuler
      </TextButton>
      <PrimaryButton icon={Icons.save} onPress={handleSave} tone="primary" variant="outline" style={styles.actionButton}>
        Sauvegarder
      </PrimaryButton>
      <PrimaryButton icon={Icons.check} onPress={handleValidate} tone="success" style={styles.actionButton}>
        Valider la correction
      </PrimaryButton>
    </View>
  );

  return (
    <ScreenFrame compactHeader onBack={handleCancel} title="Révision de la copie" scrollable={false}>
      <View style={styles.page}>
        {renderStudentCard()}
        <View style={[styles.mainLayout, isLargeScreen && styles.mainLayoutRow]}>
          <View style={[styles.mainLayoutLeft, isLargeScreen && { flex: 1 }]}>
            {renderImageSection()}
          </View>
          <View style={[styles.mainLayoutRight, isLargeScreen && { flex: 1 }]}>
            {renderAnswerList()}
          </View>
        </View>
        {renderBottomActions()}
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  studentInfoBlock: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  studentMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  scoreBadge: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  scoreBadgeValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  mainLayout: {
    flex: 1,
    gap: spacing.md,
  },
  mainLayoutRow: {
    flexDirection: 'row',
  },
  mainLayoutLeft: {
    maxHeight: 320,
  },
  mainLayoutRight: {
    flex: 1,
    minHeight: 0,
  },
  sectionLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  imageSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  zoomBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },
  imageScroll: {
    borderRadius: radius.md,
    minHeight: 220,
    backgroundColor: colors.screen,
  },
  imageScrollContent: {
    minHeight: 260,
  },
  imageWrapper: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  imagePlaceholderText: {
    color: colors.faint,
    fontSize: 13,
    fontWeight: '600',
  },
  questionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  questionHighlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    backgroundColor: 'rgba(108, 92, 255, 0.1)',
  },
  zoomHint: {
    color: colors.faint,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  answerListSection: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    minHeight: 0,
  },
  answerListScroll: {
    paddingBottom: spacing.sm,
  },
  answerGrid: {
    gap: spacing.xs,
  },
  answerQuestionCard: {
    backgroundColor: colors.screen,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderLeftWidth: 3,
    gap: spacing.xs,
  },
  answerQuestionCardSelected: {
    backgroundColor: colors.primarySoft,
    borderLeftWidth: 3,
  },
  answerQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  answerQuestionDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerQuestionNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  answerBubbleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  answerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerBubbleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  answerQuestionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  answerPointsText: {
    color: colors.faint,
    fontSize: 11,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 0,
  },
  pressed: {
    opacity: 0.72,
  },
});
