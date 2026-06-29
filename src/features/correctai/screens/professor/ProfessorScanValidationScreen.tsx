import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Card, Field, Icon, Icons, InfoRow, PrimaryButton, ScreenFrame, StatusPill } from '@/features/correctai/components/ui';
import { classes, exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { ClassRoom, ScannedCopy, Tone } from '@/features/correctai/types';
import {
  answerSheetChoices,
  buildCopyCorrectionSummary,
  formatDelimitedClassName,
  formatScannedCopyDateTime,
  formatScoreValue,
  getResponseSheetOptionFromQuestions,
  parseDetectedAnswers,
  parseDetectedAnswerToken,
  reviewStatusLabel,
  reviewStatusTone,
  type ProfessorScreenProps,
} from './shared';

const { colors, spacing, radius } = correctAiTheme;

type ScannedCopyDraftValues = {
  studentName: string;
  matricule: string;
  className: string;
  examName: string;
  detectedAnswersText: string;
};

type AnswerSheetLayout = {
  columns: number;
  columnGap: number;
  rowGap: number;
  questionHeaderWidth: number;
  questionHeaderFontSize: number;
  bubbleHeaderFontSize: number;
  questionNumberWidth: number;
  questionNumberFontSize: number;
  questionRowMinHeight: number;
  bubbleSize: number;
  bubbleBorderWidth: number;
  instructionText: string;
};

const answerSheetLayouts: Record<20 | 50 | 100, AnswerSheetLayout> = {
  20: {
    columns: 2,
    columnGap: spacing.sm,
    rowGap: 2,
    questionHeaderWidth: 16,
    questionHeaderFontSize: 9,
    bubbleHeaderFontSize: 8,
    questionNumberWidth: 16,
    questionNumberFontSize: 9,
    questionRowMinHeight: 15,
    bubbleSize: 9.5,
    bubbleBorderWidth: 1,
    instructionText: 'MARQUEZ VOTRE RÉPONSE DANS LA BULLE CORRECTE.',
  },
  50: {
    columns: 5,
    columnGap: 4,
    rowGap: 1,
    questionHeaderWidth: 12,
    questionHeaderFontSize: 7,
    bubbleHeaderFontSize: 6.5,
    questionNumberWidth: 12,
    questionNumberFontSize: 7,
    questionRowMinHeight: 11,
    bubbleSize: 6.8,
    bubbleBorderWidth: 0.9,
    instructionText: 'MARQUEZ ENTIÈREMENT LA BULLE DE VOTRE RÉPONSE.',
  },
  100: {
    columns: 4,
    columnGap: 3,
    rowGap: 0.5,
    questionHeaderWidth: 10,
    questionHeaderFontSize: 6.2,
    bubbleHeaderFontSize: 5.6,
    questionNumberWidth: 10,
    questionNumberFontSize: 6.2,
    questionRowMinHeight: 8.5,
    bubbleSize: 5.2,
    bubbleBorderWidth: 0.75,
    instructionText: 'MARQUEZ ENTIÈREMENT LA BULLE DE VOTRE RÉPONSE.',
  },
};

function getAnswerSheetLayout(questionCount: number) {
  if (questionCount >= 100) return answerSheetLayouts[100];
  if (questionCount >= 50) return answerSheetLayouts[50];
  return answerSheetLayouts[20];
}

function AnswerSheetFormField({
  label,
  value,
  style,
}: {
  label: string;
  value?: string;
  style?: any;
}) {
  return (
    <View style={[styles.answerSheetFormField, style]}>
      <Text style={styles.answerSheetFormLabel}>{label}</Text>
      <View style={styles.answerSheetFormValueLine}>
        {value ? (
          <Text ellipsizeMode="tail" numberOfLines={1} style={styles.answerSheetFormValue}>
            {value}
          </Text>
        ) : (
          <View style={styles.answerSheetFormBlank} />
        )}
      </View>
    </View>
  );
}

function AnswerSheetColumn({
  count,
  selectedAnswers,
  start,
  layout,
}: {
  count: number;
  start: number;
  layout: AnswerSheetLayout;
  selectedAnswers?: string[];
}) {
  if (count <= 0) {
    return <View style={styles.answerSheetColumn} />;
  }

  return (
    <View style={styles.answerSheetColumn}>
      <View style={[styles.answerSheetColumnHeader, { gap: 2, paddingBottom: 1 }]}>
        <Text
          style={[
            styles.answerSheetQuestionHeader,
            {
              width: layout.questionHeaderWidth,
              fontSize: layout.questionHeaderFontSize,
            },
          ]}>
          N°
        </Text>
        {answerSheetChoices.map((choice) => (
          <Text
            key={choice}
            style={[
              styles.answerSheetBubbleHeader,
              {
                fontSize: layout.bubbleHeaderFontSize,
              },
            ]}>
            {choice}
          </Text>
        ))}
      </View>
      {Array.from({ length: count }, (_, index) => {
        const questionNumber = start + index;
        const selectedChoices = parseDetectedAnswerToken(selectedAnswers?.[questionNumber - 1]);

        return (
          <View
            key={questionNumber}
            style={[
              styles.answerSheetQuestionRow,
              {
                minHeight: layout.questionRowMinHeight,
                gap: layout.rowGap,
              },
            ]}>
            <Text
              style={[
                styles.answerSheetQuestionNumber,
                {
                  width: layout.questionNumberWidth,
                  fontSize: layout.questionNumberFontSize,
                },
              ]}>
              {questionNumber}
            </Text>
            <View style={[styles.answerSheetBubbles, { gap: layout.rowGap }]}>
              {answerSheetChoices.map((choice) => (
                <View
                  key={choice}
                  style={[
                    styles.answerSheetBubble,
                    selectedChoices.includes(choice) && styles.answerSheetBubbleSelected,
                    {
                      width: layout.bubbleSize,
                      height: layout.bubbleSize,
                      borderWidth: layout.bubbleBorderWidth,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ScannedCopySheetPreview({
  copy,
  classList,
  questionCount,
}: {
  copy: ScannedCopy;
  classList: ClassRoom[];
  questionCount: number;
}) {
  const responseSheet = getResponseSheetOptionFromQuestions(questionCount);
  const layout = getAnswerSheetLayout(responseSheet.questions);
  const questionsPerColumn = Math.ceil(questionCount / layout.columns);
  const answerSheetColumns = Array.from({ length: layout.columns }, (_, columnIndex) => {
    const start = columnIndex * questionsPerColumn + 1;
    const count = Math.max(0, Math.min(questionsPerColumn, questionCount - columnIndex * questionsPerColumn));

    return {
      count,
      start,
    };
  });

  return (
    <View style={styles.scannedCopySheetPaper}>
      {copy.imageUri ? (
        <View
          style={{
            width: '100%',
            minHeight: 320,
            borderRadius: radius.lg,
            backgroundColor: colors.card,
            padding: spacing.sm,
            marginBottom: spacing.md,
          }}>
          <Image
            source={{ uri: copy.imageUri }}
            resizeMode="contain"
            style={{ width: '100%', height: 360, borderRadius: radius.md, backgroundColor: colors.screen }}
          />
          <Text style={{ marginTop: spacing.sm, color: colors.muted, fontSize: 12, textAlign: 'center' }}>
            Aperçu du scan capturé
          </Text>
        </View>
      ) : null}
      <View style={styles.answerSheetPaperHeader}>
        <View style={styles.answerSheetBrandBlock}>
          <Image
            source={require('../../../../../assets/images/correctai-splash-logo.png')}
            resizeMode="contain"
            style={styles.answerSheetLogo}
          />
          <Text style={styles.answerSheetBrandSubtitle}>Correction intelligente par IA</Text>
        </View>
        <View style={styles.answerSheetPaperTitleBlock}>
          <Text style={styles.answerSheetPaperTitle}>FEUILLE DE RÉPONSES QCM</Text>
          <Text style={styles.answerSheetPaperSubtitle}>{`${questionCount} Questions - A4`}</Text>
        </View>
      </View>

      <View style={styles.answerSheetPaperDivider} />

      <View style={styles.answerSheetFormSection}>
        <View style={styles.answerSheetFormRow}>
          <AnswerSheetFormField label="Nom complet" value={copy.studentName} style={styles.answerSheetFormHalf} />
          <AnswerSheetFormField label="Classe" value={formatDelimitedClassName(copy.className, classList)} style={styles.answerSheetFormHalf} />
        </View>
        <View style={styles.answerSheetFormRow}>
          <AnswerSheetFormField label="Matricule" value={copy.matricule} style={styles.answerSheetFormHalf} />
          <AnswerSheetFormField label="Date" value={formatScannedCopyDateTime(copy.scannedAt)} style={styles.answerSheetFormHalf} />
        </View>
      </View>

      <View style={styles.answerSheetInstructions}>
        <Text style={styles.answerSheetInstructionsText}>Bullez la bonne réponse pour chaque question</Text>
      </View>

      <View style={styles.answerSheetColumns}>
        {answerSheetColumns.map((column) => (
          <AnswerSheetColumn
            key={column.start}
            count={column.count}
            layout={layout}
            selectedAnswers={copy.detectedAnswers}
            start={column.start}
          />
        ))}
      </View>

      <View style={styles.answerSheetSignatureRow}>
        <Text style={styles.answerSheetSignatureLabel}>N° DE FEUILLE / SIGNATURE</Text>
        <View style={styles.answerSheetSignatureLine} />
      </View>
    </View>
  );
}

function CopyReviewEditor({
  copy,
  questionCount,
  classList,
  correctionSummary,
  onValidate,
  onContinueCorrection,
  onReturnScanner,
}: {
  copy: ScannedCopy;
  questionCount: number;
  classList: ClassRoom[];
  correctionSummary?: ReturnType<typeof buildCopyCorrectionSummary>;
  onValidate: (values: ScannedCopyDraftValues) => void;
  onContinueCorrection: (values: ScannedCopyDraftValues) => void;
  onReturnScanner: () => void;
}) {
  const [studentName, setStudentName] = useState(copy.studentName);
  const [matricule, setMatricule] = useState(copy.matricule);
  const [className, setClassName] = useState(formatDelimitedClassName(copy.className, classList));
  const [examName, setExamName] = useState(copy.examName);
  const [detectedAnswersText, setDetectedAnswersText] = useState(copy.detectedAnswers.join(', '));

  const detectedAnswers = useMemo(() => parseDetectedAnswers(detectedAnswersText), [detectedAnswersText]);
  const confidenceTone: Tone = copy.aiConfidence >= 80 ? 'success' : copy.aiConfidence >= 60 ? 'warning' : 'danger';

  const buildValues = (): ScannedCopyDraftValues => ({
    studentName: studentName.trim() || 'Non identifié',
    matricule: matricule.trim() || '0',
    className: className.trim() || 'Aucune classe',
    examName: examName.trim() || copy.examName,
    detectedAnswersText: detectedAnswers.length ? detectedAnswers.join(', ') : detectedAnswersText.trim(),
  });

  return (
    <Card icon={Icons.doc} style={styles.reviewEditorCard} title="Réviser la copie" subtitle={formatScannedCopyDateTime(copy.scannedAt)}>
      <View style={styles.reviewEditorHero}>
        <View style={styles.reviewEditorSheetPreviewWrap}>
          <ScannedCopySheetPreview copy={copy} classList={classList} questionCount={questionCount} />
        </View>
        <View style={styles.reviewEditorHeroText}>
          <Text style={styles.reviewEditorName}>{studentName || 'Non identifié'}</Text>
          <Text style={styles.reviewEditorMeta}>Matricule {matricule || '0'}</Text>
          <Text style={styles.reviewEditorMeta}>{className || 'Aucune classe'}</Text>
          <View style={styles.reviewEditorPillRow}>
            <StatusPill label={`Confiance ${copy.aiConfidence}%`} tone={confidenceTone} />
            <StatusPill label={reviewStatusLabel(copy.reviewStatus)} tone={reviewStatusTone(copy.reviewStatus)} />
          </View>
        </View>
      </View>

      <View style={styles.reviewEditorFields}>
        <Field label="Nom complet *" value={studentName} onChangeText={setStudentName} autoCapitalize="words" />
        <Field label="Matricule *" value={matricule} onChangeText={setMatricule} autoCapitalize="none" autoCorrect={false} />
        <Field label="Classe *" value={className} onChangeText={setClassName} autoCapitalize="words" />
        <Field label="Examen *" value={examName} onChangeText={setExamName} autoCapitalize="words" />
      </View>

      <View style={styles.reviewEditorSummary}>
        <InfoRow label="Nombre de réponses détectées" value={String(detectedAnswers.length)} />
        <InfoRow label="Nombre de questions" value={String(questionCount)} />
        <InfoRow label="Métadonnées IA" value={`Confiance ${copy.aiConfidence}%`} />
        <InfoRow
          label="Score calculé"
          value={
            correctionSummary
              ? `${formatScoreValue(correctionSummary.totalPoints)} / ${formatScoreValue(correctionSummary.maxPoints)}`
              : '--'
          }
        />
        <InfoRow
          label="Pourcentage"
          value={correctionSummary ? `${correctionSummary.percentage}%` : '--'}
        />
        <InfoRow
          label="Date de correction"
          value={correctionSummary ? formatScannedCopyDateTime(correctionSummary.reviewedAt) : '--'}
        />
      </View>

      <View style={styles.reviewDetectedSection}>
        <Text style={styles.reviewDetectedLabel}>Réponses détectées</Text>
        <Field
          label=""
          multiline
          numberOfLines={4}
          style={styles.reviewDetectedInput}
          value={detectedAnswersText}
          onChangeText={setDetectedAnswersText}
        />
        <Text style={styles.reviewDetectedHint}>
          Séparez les réponses par une virgule. Exemple : A, B+C, D.
        </Text>
        <View style={styles.reviewAnswerChips}>
          {detectedAnswers.slice(0, 8).map((answer, index) => (
            <View key={`${answer}-${index}`} style={styles.reviewAnswerChip}>
              <Text style={styles.reviewAnswerChipText}>{answer}</Text>
            </View>
          ))}
          {detectedAnswers.length > 8 ? (
            <View style={styles.reviewAnswerChipMuted}>
              <Text style={styles.reviewAnswerChipMutedText}>+{detectedAnswers.length - 8}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.reviewEditorActions}>
        <PrimaryButton tone="neutral" variant="outline" onPress={onReturnScanner} style={styles.reviewEditorActionButton}>
          Retour scanner
        </PrimaryButton>
        <PrimaryButton
          tone="success"
          onPress={() => onContinueCorrection(buildValues())}
          style={styles.reviewEditorActionButton}>
          Continuer correction
        </PrimaryButton>
        <PrimaryButton
          icon={Icons.check}
          onPress={() => onValidate(buildValues())}
          style={styles.reviewEditorActionButton}>
          Valider
        </PrimaryButton>
      </View>
    </Card>
  );
}

export function ProfessorScanValidationScreen({
  onNavigate,
  onSelectScannedCopy,
  onUpdateExam,
  classesData,
  selectedExam,
  selectedScannedCopy,
}: ProfessorScreenProps) {
  const exam = selectedExam ?? exams[0] ?? null;
  const classList = classesData ?? classes;
  const copy = useMemo(() => {
    if (!exam?.scannedCopies?.length) {
      return null;
    }

    return (
      exam.scannedCopies.find((item) => item.id === selectedScannedCopy?.id) ??
      selectedScannedCopy ??
      exam.scannedCopies[0] ??
      null
    );
  }, [exam, selectedScannedCopy]);

  const correctionSummary = useMemo(() => (exam && copy ? buildCopyCorrectionSummary(exam, copy) : null), [copy, exam]);

  if (!exam) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-review-copies')} title="Réviser la copie">
        <Card icon={Icons.info} style={styles.listCard} title="Aucune copie disponible">
          <Text style={styles.emptyText}>Lancez un scan pour ouvrir une copie à réviser.</Text>
        </Card>
      </ScreenFrame>
    );
  }

  if (!copy) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-review-copies')} title="Réviser la copie">
        <Card icon={Icons.search} style={styles.listCard} title="Aucune copie sélectionnée">
          <Text style={styles.emptyText}>Choisissez une copie dans l'historique pour la vérifier.</Text>
          <PrimaryButton
            icon={Icons.doc}
            onPress={() => onNavigate('professor-review-copies')}
            tone="warning"
            style={styles.reviewEmptyButton}>
            Retour historique
          </PrimaryButton>
        </Card>
      </ScreenFrame>
    );
  }

  const persistCopy = (values: ScannedCopyDraftValues, reviewStatus: ScannedCopy['reviewStatus']) => {
    if (!copy || !correctionSummary) {
      return;
    }

    const nextCopy: ScannedCopy = {
      ...copy,
      studentName: values.studentName,
      matricule: values.matricule,
      className: values.className,
      examName: values.examName,
      detectedAnswers: parseDetectedAnswers(values.detectedAnswersText),
      detectedAnswersCount: parseDetectedAnswers(values.detectedAnswersText).length,
      reviewStatus,
      calculatedScore: `${formatScoreValue(correctionSummary.totalPoints)}/${formatScoreValue(correctionSummary.maxPoints)}`,
      metadata: {
        source: copy.metadata?.source ?? 'scanner',
        processedAt: copy.metadata?.processedAt ?? copy.scannedAt,
        reviewedAt: new Date().toISOString(),
      },
    };
    const nextCopies = (exam.scannedCopies ?? []).map((item) => (item.id === copy.id ? nextCopy : item));

    onUpdateExam?.({
      ...exam,
      copies: nextCopies.length,
      scannedCopies: nextCopies,
    });
    onSelectScannedCopy?.(nextCopy);
  };

  return (
    <ScreenFrame
      compactHeader
      onBack={() => onNavigate('professor-review-copies')}
      title="Réviser la copie">
      <View style={styles.copyReviewPage}>
        <CopyReviewEditor
          key={copy.id}
          copy={copy}
          classList={classList}
          correctionSummary={correctionSummary ?? undefined}
          questionCount={exam.questions}
          onContinueCorrection={(values) => {
            persistCopy(values, 'VALIDATED');
            onNavigate('professor-answer-key');
          }}
          onReturnScanner={() => onNavigate('professor-scanner')}
          onValidate={(values) => persistCopy(values, 'VALIDATED')}
        />
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  listCard: { gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  reviewEmptyButton: { alignSelf: 'flex-start' },
  copyReviewPage: { flex: 1, minHeight: 0 },
  reviewEditorCard: { gap: spacing.md },
  reviewEditorHero: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  reviewEditorSheetPreviewWrap: { width: '42%', minWidth: 132, maxWidth: 180, flexShrink: 0 },
  reviewEditorHeroText: { flex: 1, minWidth: 0, gap: spacing.xs },
  reviewEditorName: { color: colors.ink, fontSize: 20, fontWeight: '900', lineHeight: 26 },
  reviewEditorMeta: { color: colors.muted, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  reviewEditorPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingTop: spacing.xs },
  reviewEditorFields: { gap: spacing.md },
  reviewEditorSummary: { gap: spacing.xs },
  reviewDetectedSection: { gap: spacing.xs },
  reviewDetectedLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  reviewDetectedInput: { minHeight: 96, textAlignVertical: 'top' },
  reviewDetectedHint: { color: colors.muted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  reviewAnswerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  reviewAnswerChip: { minHeight: 32, borderRadius: radius.sm, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  reviewAnswerChipText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  reviewAnswerChipMuted: { minHeight: 32, borderRadius: radius.sm, backgroundColor: colors.neutralSoft, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  reviewAnswerChipMutedText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  reviewEditorActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reviewEditorActionButton: { flexGrow: 1, flexBasis: '30%' },
  scannedCopySheetPaper: { width: '100%', aspectRatio: 0.72, borderRadius: 16, backgroundColor: '#FCFCFF', borderWidth: 1, borderColor: '#E5E8F4', padding: 8, shadowColor: '#1F2440', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  answerSheetPaperHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xs },
  answerSheetBrandBlock: { gap: 2, alignItems: 'flex-start', flexShrink: 1 },
  answerSheetLogo: { width: 74, height: 22 },
  answerSheetBrandSubtitle: { color: colors.muted, fontSize: 11, fontWeight: '600', lineHeight: 15 },
  answerSheetPaperTitleBlock: { alignItems: 'flex-end', gap: 2, flexShrink: 1 },
  answerSheetPaperTitle: { color: colors.ink, fontSize: 11, fontWeight: '900', textAlign: 'right', lineHeight: 16 },
  answerSheetPaperSubtitle: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  answerSheetPaperDivider: { height: 2, backgroundColor: colors.primary, borderRadius: 999 },
  answerSheetFormSection: { gap: 4 },
  answerSheetFormRow: { flexDirection: 'row', gap: 8 },
  answerSheetFormHalf: { flex: 1 },
  answerSheetFormField: { flex: 1, gap: 2 },
  answerSheetFormLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  answerSheetFormValueLine: { minHeight: 16, justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#D2D7F4' },
  answerSheetFormValue: { color: colors.ink, fontSize: 11, fontWeight: '700', lineHeight: 14, paddingBottom: 2 },
  answerSheetFormBlank: { minHeight: 14 },
  answerSheetInstructions: { alignItems: 'center', paddingVertical: 1 },
  answerSheetInstructionsText: { color: colors.primary, fontSize: 9, fontWeight: '800', textAlign: 'center' },
  answerSheetColumns: { flex: 1, flexDirection: 'row', alignItems: 'stretch', paddingVertical: 1 },
  answerSheetColumn: { flex: 1, gap: 1, minWidth: 0 },
  answerSheetColumnHeader: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 1 },
  answerSheetQuestionHeader: { width: 18, color: colors.muted, fontSize: 9, fontWeight: '800', textAlign: 'left' },
  answerSheetBubbleHeader: { flex: 1, color: colors.muted, fontSize: 8, fontWeight: '800', textAlign: 'center' },
  answerSheetQuestionRow: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 11 },
  answerSheetQuestionNumber: { width: 18, color: colors.ink, fontSize: 9, fontWeight: '800', textAlign: 'left' },
  answerSheetBubbles: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1 },
  answerSheetBubble: { width: 10, height: 10, borderRadius: 999, borderWidth: 1, borderColor: '#B6BCF5', backgroundColor: colors.card },
  answerSheetBubbleSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  answerSheetSignatureRow: { gap: 2, paddingTop: 1 },
  answerSheetSignatureLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  answerSheetSignatureLine: { height: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primarySoft, backgroundColor: colors.screen },
});
