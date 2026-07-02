import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Card,
  Icon,
  Icons,
  InfoRow,
  PrimaryButton,
  ScreenFrame,
  SegmentedControl,
  StatusPill,
  TextButton,
} from '@/features/correctai/components/ui';
import { classes, exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { Exam } from '@/features/correctai/types';
import {
  buildCopyCorrectionSummary,
  formatDelimitedClassName,
  formatDetectedAnswerToken,
  formatScannedCopyDateTime,
  formatScoreValue,
  ProfessorScreenProps,
  reviewStatusLabel,
  reviewStatusTone,
} from './shared';

const { colors, spacing, radius } = correctAiTheme;

export function ProfessorScannedCopyDetailScreen({
  onNavigate,
  onSelectScannedCopy,
  onUpdateExam,
  classesData,
  selectedExam,
  selectedScannedCopy,
}: ProfessorScreenProps) {
  type CopyDetailTab = 'image' | 'questions' | 'tags';
  const exam = selectedExam ?? exams[0] ?? null;
  const classList = classesData ?? classes;
  const [detailTab, setDetailTab] = useState<CopyDetailTab>('image');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [sheetAreaWidth, setSheetAreaWidth] = useState(0);

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

  useEffect(() => {
    if (!copy) {
      console.log('[CopyDetail] render state: no copy selected');
      return;
    }

    console.log(
      '[CopyDetail] loaded persisted copy: copyId=%s examId=%s examName=%s student=%s matricule=%s class=%s score=%s scannedAt=%s hasAnnotated=%s hasOCR=%s hasOMR=%s',
      copy.id,
      copy.examId,
      copy.examName,
      copy.studentName,
      copy.matricule,
      copy.className,
      copy.calculatedScore ?? '--',
      copy.scannedAt,
      Boolean(copy.annotatedImageUri),
      Boolean(copy.ocrResult),
      Boolean(copy.omrResult),
    );
  }, [copy]);

  const correctionSummary = useMemo(() => (exam && copy ? buildCopyCorrectionSummary(exam, copy) : null), [copy, exam]);
  const detailTabs: { id: CopyDetailTab; label: string }[] = [
    { id: 'image', label: 'IMAGE' },
    { id: 'questions', label: 'QUESTIONS' },
    { id: 'tags', label: 'TAGS' },
  ];
  const previewWidth = sheetAreaWidth ? Math.max(280, sheetAreaWidth - spacing.md * 2) * zoomLevel : 0;

  useEffect(() => {
    setDetailTab('image');
    setZoomLevel(1);
    setMenuVisible(false);
    setDeleteVisible(false);
    setSheetAreaWidth(0);
  }, [copy?.id]);

  if (!exam) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-review-copies')} title="Copie détaillée">
        <Card icon={Icons.info} style={styles.listCard} title="Aucune copie disponible">
          <Text style={styles.emptyText}>Lancez un scan pour ouvrir une copie à consulter.</Text>
        </Card>
      </ScreenFrame>
    );
  }

  if (!copy) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-review-copies')} title="Copie détaillée">
        <Card icon={Icons.search} style={styles.listCard} title="Aucune copie sélectionnée">
          <Text style={styles.emptyText}>Choisissez une copie dans l'historique pour l'ouvrir.</Text>
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

  const deleteScannedCopy = () => {
    const nextCopies = (exam.scannedCopies ?? []).filter((item) => item.id !== copy.id);
    const nextExam: Exam = {
      ...exam,
      copies: nextCopies.length,
      scannedCopies: nextCopies.map((item) => ({
        ...item,
        detectedAnswers: [...item.detectedAnswers],
        metadata: item.metadata ? { ...item.metadata } : undefined,
      })),
    };

    onUpdateExam?.(nextExam);
    setDeleteVisible(false);
    setMenuVisible(false);
    onNavigate('professor-review-copies');
  };

  const openEditor = () => {
    setMenuVisible(false);
    onSelectScannedCopy?.(copy);
    onNavigate('professor-copy-revision');
  };

  const openTab = (tab: CopyDetailTab) => {
    setDetailTab(tab);
    setMenuVisible(false);
  };

  const zoomOut = () => setZoomLevel((current) => Math.max(0.8, Math.round((current - 0.1) * 10) / 10));
  const zoomIn = () => setZoomLevel((current) => Math.min(1.6, Math.round((current + 0.1) * 10) / 10));

  return (
      <ScreenFrame
        compactHeader
        onBack={() => onNavigate('professor-review-copies')}
        rightAction={{ icon: Icons.more, onPress: () => setMenuVisible(true) }}
        scrollable={false}
        title="Copie détaillée">
      <View style={styles.copyDetailPage}>
        <View style={styles.copyDetailSummaryStrip}>
          <View style={styles.copyDetailSummaryTitleRow}>
            <View style={styles.copyDetailSummaryTitleBlock}>
              <Text numberOfLines={1} style={styles.copyDetailSummaryTitle}>
                {copy.studentName}
              </Text>
              <Text numberOfLines={1} style={styles.copyDetailSummarySubtitle}>
                {copy.examName} · {formatDelimitedClassName(copy.className, classList)}
              </Text>
            </View>
            <View style={styles.copyDetailSummaryPills}>
              <StatusPill label={reviewStatusLabel(copy.reviewStatus)} tone={reviewStatusTone(copy.reviewStatus)} />
              <StatusPill
                label={
                  correctionSummary
                    ? `${formatScoreValue(correctionSummary.totalPoints)} / ${formatScoreValue(correctionSummary.maxPoints)}`
                    : copy.calculatedScore ?? '—'
                }
                tone="primary"
              />
            </View>
          </View>

          <View style={styles.copyDetailSummaryMetaGrid}>
            <View style={styles.copyDetailSummaryMiniField}>
              <Text style={styles.copyDetailSummaryLabel}>Nom complet</Text>
              <Text numberOfLines={1} style={styles.copyDetailSummaryValue}>
                {copy.studentName}
              </Text>
            </View>
            <View style={styles.copyDetailSummaryMiniField}>
              <Text style={styles.copyDetailSummaryLabel}>Classe</Text>
              <Text numberOfLines={1} style={styles.copyDetailSummaryValue}>
                {formatDelimitedClassName(copy.className, classList)}
              </Text>
            </View>
            <View style={styles.copyDetailSummaryMiniField}>
              <Text style={styles.copyDetailSummaryLabel}>Matricule</Text>
              <Text numberOfLines={1} style={styles.copyDetailSummaryValue}>
                {copy.matricule}
              </Text>
            </View>
            <View style={styles.copyDetailSummaryMiniField}>
              <Text style={styles.copyDetailSummaryLabel}>Exam name</Text>
              <Text numberOfLines={1} style={styles.copyDetailSummaryValue}>
                {copy.examName}
              </Text>
            </View>
            <View style={styles.copyDetailSummaryMiniField}>
              <Text style={styles.copyDetailSummaryLabel}>Exam date</Text>
              <Text numberOfLines={1} style={styles.copyDetailSummaryValue}>
                {formatScannedCopyDateTime(copy.scannedAt)}
              </Text>
            </View>
            <View style={styles.copyDetailSummaryMiniField}>
              <Text style={styles.copyDetailSummaryLabel}>Score</Text>
              <Text numberOfLines={1} style={[styles.copyDetailSummaryValue, styles.copyDetailSummaryValuePrimary]}>
                {correctionSummary
                  ? `${formatScoreValue(correctionSummary.totalPoints)} / ${formatScoreValue(correctionSummary.maxPoints)} · ${correctionSummary.percentage}%`
                  : copy.calculatedScore ?? '—'}
              </Text>
            </View>
          </View>
        </View>

        <SegmentedControl active={detailTab} onChange={(value) => setDetailTab(value as CopyDetailTab)} options={detailTabs} />

        <View style={styles.copyDetailPanel} onLayout={({ nativeEvent }) => setSheetAreaWidth(nativeEvent.layout.width)}>
          {detailTab === 'image' ? (
            <Animated.ScrollView
              style={styles.copyDetailScroll}
              contentContainerStyle={[styles.copyDetailImageScrollContent, { backgroundColor: '#000' }]}
              horizontal={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <View style={styles.copyDetailZoomRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={zoomOut}
                  style={({ pressed }) => [styles.copyDetailZoomButton, pressed && styles.pressed]}>
                  <Icon name={Icons.minus} color={colors.primary} size={14} />
                </Pressable>
                <Text style={styles.copyDetailZoomValue}>{Math.round(zoomLevel * 100)}%</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={zoomIn}
                  style={({ pressed }) => [styles.copyDetailZoomButton, pressed && styles.pressed]}>
                  <Icon name={Icons.plus} color={colors.primary} size={14} />
                </Pressable>
              </View>

              <Animated.ScrollView
                contentContainerStyle={[styles.copyDetailSheetPanContent, { backgroundColor: '#000' }]}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={{ width: previewWidth || 300, height: previewWidth ? previewWidth * 1.4 : 400, backgroundColor: '#000', overflow: 'hidden' }}>
                  {copy.annotatedImageUri || copy.imageUri ? (
                    <Image
                      source={{ uri: copy.annotatedImageUri ?? copy.imageUri }}
                      resizeMode="contain"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                      <Icon name={Icons.camera} color="#666" size={48} />
                      <Text style={{ color: '#888', fontSize: 14, marginTop: spacing.sm }}>Aucune image disponible</Text>
                    </View>
                  )}
                </View>
              </Animated.ScrollView>
            </Animated.ScrollView>
          ) : null}

          {detailTab === 'questions' && correctionSummary ? (
            <View style={styles.copyDetailTableCard}>
              <View style={styles.copyDetailTableHeader}>
                <Text style={[styles.copyDetailTableCell, styles.copyDetailQuestionCol]}>#</Text>
                <Text style={[styles.copyDetailTableCell, styles.copyDetailPrimaryCol]}>Bonne réponse</Text>
                <Text style={[styles.copyDetailTableCell, styles.copyDetailStudentCol]}>Réponse élève</Text>
                <Text style={[styles.copyDetailTableCell, styles.copyDetailPointsCol]}>Points</Text>
              </View>
              <FlatList
                data={correctionSummary.rows}
                keyExtractor={(item) => String(item.number)}
                renderItem={({ item }) => (
                  <View style={styles.copyDetailTableRow}>
                    <Text style={[styles.copyDetailTableCell, styles.copyDetailQuestionCol]}>{item.number}</Text>
                    <Text style={[styles.copyDetailTableCell, styles.copyDetailPrimaryCol]} numberOfLines={1}>
                      {item.correctAnswer}
                    </Text>
                    <Text style={[styles.copyDetailTableCell, styles.copyDetailStudentCol]} numberOfLines={1}>
                      {item.studentAnswer}
                    </Text>
                    <Text style={[styles.copyDetailTableCell, styles.copyDetailPointsCol]} numberOfLines={1}>
                      {formatScoreValue(item.pointsEarned)}/{formatScoreValue(item.points)}
                    </Text>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.copyDetailTableSeparator} />}
                showsVerticalScrollIndicator={false}
                style={styles.copyDetailTableList}
                contentContainerStyle={styles.copyDetailTableListContent}
              />
            </View>
          ) : null}

          {detailTab === 'tags' ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.copyDetailScroll}
              contentContainerStyle={styles.copyDetailInfoContent}>
              <Card icon={Icons.info} style={styles.copyDetailInfoCard} title="Informations extraites" subtitle="Données détectées par AI">
                <InfoRow label="Nom complet" value={copy.studentName} />
                <InfoRow label="Matricule" value={copy.matricule} />
                <InfoRow label="Classe" value={formatDelimitedClassName(copy.className, classList)} />
                <InfoRow
                  label="OCR"
                  value={`${copy.ocrResult?.name ?? copy.studentName} · ${copy.ocrResult?.matricule ?? copy.matricule}`}
                />
                <InfoRow
                  label="OMR"
                  value={
                    copy.omrResult
                      ? `${copy.omrResult.answers.filter((answer) => Boolean(answer.answer)).length}/${copy.omrResult.answers.length} réponses`
                      : `${copy.detectedAnswersCount} réponses détectées`
                  }
                />
                <InfoRow label="Examen" value={copy.examName} />
                <InfoRow label="Date d'analyse" value={formatScannedCopyDateTime(copy.metadata?.processedAt ?? copy.scannedAt)} />
                <InfoRow label="Statut" value={reviewStatusLabel(copy.reviewStatus)} />
                <InfoRow label="Nombre de réponses détectées" value={String(copy.detectedAnswersCount)} />
                <InfoRow label="Score calculé" value={copy.calculatedScore ?? '--'} />
                <InfoRow label="Confiance IA" value={`${copy.aiConfidence}%`} />
              </Card>

              <Card icon={Icons.key} style={styles.copyDetailInfoCard} title="Réponses détectées" subtitle="Aperçu des réponses extraites">
                <View style={styles.copyDetailChipWrap}>
                  {copy.detectedAnswers.length ? (
                    copy.detectedAnswers.slice(0, 12).map((answer, index) => (
                      <View key={`${answer}-${index}`} style={styles.copyDetailChip}>
                        <Text style={styles.copyDetailChipText}>{formatDetectedAnswerToken(answer)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.copyDetailEmptyTagText}>Aucune réponse détectée.</Text>
                  )}
                </View>
                {copy.detectedAnswers.length > 12 ? (
                  <Text style={styles.copyDetailMoreTagsText}>+{copy.detectedAnswers.length - 12} réponses supplémentaires</Text>
                ) : null}
              </Card>
            </ScrollView>
          ) : null}
        </View>
      </View>

      <Modal animationType="fade" transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.copyDetailModalBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.copyDetailMenuCard} onPress={(event) => event.stopPropagation()}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openTab('image')}
              style={({ pressed }) => [styles.copyDetailMenuItem, pressed && styles.pressed]}>
              <Icon name={Icons.doc} color={colors.primary} size={18} />
              <Text style={styles.copyDetailMenuText}>Voir l'image</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => openTab('questions')}
              style={({ pressed }) => [styles.copyDetailMenuItem, pressed && styles.pressed]}>
              <Icon name={Icons.chart} color={colors.primary} size={18} />
              <Text style={styles.copyDetailMenuText}>Détails correction</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => openTab('tags')}
              style={({ pressed }) => [styles.copyDetailMenuItem, pressed && styles.pressed]}>
              <Icon name={Icons.info} color={colors.primary} size={18} />
              <Text style={styles.copyDetailMenuText}>Informations extraites</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={openEditor}
              style={({ pressed }) => [styles.copyDetailMenuItem, pressed && styles.pressed]}>
              <Icon name={Icons.edit} color={colors.primary} size={18} />
              <Text style={styles.copyDetailMenuText}>Modifier la copie</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuVisible(false);
                setDeleteVisible(true);
              }}
              style={({ pressed }) => [styles.copyDetailMenuItem, styles.copyDetailMenuItemDanger, pressed && styles.pressed]}>
              <Icon name={Icons.trash} color={colors.danger} size={18} />
              <Text style={[styles.copyDetailMenuText, styles.copyDetailMenuTextDanger]}>Supprimer la copie</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" transparent visible={deleteVisible} onRequestClose={() => setDeleteVisible(false)}>
        <Pressable style={styles.copyDetailModalBackdrop} onPress={() => setDeleteVisible(false)}>
          <Pressable style={styles.copyDetailConfirmCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.copyDetailConfirmTitle}>Supprimer la copie</Text>
            <Text style={styles.copyDetailConfirmText}>
              Cette action va supprimer définitivement cette copie scannée de l'historique de révision.
            </Text>
            <View style={styles.copyDetailConfirmActions}>
              <TextButton onPress={() => setDeleteVisible(false)} tone="neutral">
                Annuler
              </TextButton>
              <PrimaryButton icon={Icons.trash} onPress={deleteScannedCopy} tone="danger">
                Supprimer
              </PrimaryButton>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  copyDetailPage: {
    flex: 1,
    minHeight: 0,
    gap: spacing.sm,
  },
  copyDetailSummaryStrip: {
    borderRadius: 20,
    backgroundColor: colors.card,
    padding: spacing.sm,
    gap: spacing.xs,
    shadowColor: '#1F2440',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  copyDetailSummaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  copyDetailSummaryTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  copyDetailSummaryTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  copyDetailSummarySubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  copyDetailSummaryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  copyDetailSummaryMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  copyDetailSummaryMiniField: {
    flexGrow: 1,
    flexBasis: '31%',
    minWidth: 96,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFBFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    justifyContent: 'center',
    gap: 2,
  },
  copyDetailSummaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  copyDetailSummaryValue: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 16,
  },
  copyDetailSummaryValuePrimary: {
    color: colors.primary,
  },
  copyDetailPanel: {
    flex: 1,
    minHeight: 0,
    borderRadius: 22,
    backgroundColor: colors.screen,
    padding: spacing.sm,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  copyDetailScroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.screen,
  },
  copyDetailZoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  copyDetailZoomButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyDetailZoomValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    minWidth: 52,
    textAlign: 'center',
  },
  copyDetailImageScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.sm,
    backgroundColor: colors.screen,
  },
  copyDetailSheetPanContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.screen,
  },
  copyDetailTableCard: {
    flex: 1,
    minHeight: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  copyDetailTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  copyDetailTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copyDetailTableCell: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  copyDetailQuestionCol: {
    width: 34,
    flexShrink: 0,
    textAlign: 'center',
  },
  copyDetailPrimaryCol: {
    flex: 1,
    minWidth: 0,
  },
  copyDetailStudentCol: {
    flex: 1,
    minWidth: 0,
  },
  copyDetailPointsCol: {
    width: 62,
    flexShrink: 0,
    textAlign: 'right',
  },
  copyDetailTableSeparator: {
    height: 1,
    backgroundColor: '#EEF1F8',
  },
  copyDetailTableList: {
    flex: 1,
    minHeight: 0,
  },
  copyDetailTableListContent: {
    paddingBottom: spacing.sm,
  },
  copyDetailInfoContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  copyDetailInfoCard: {
    gap: spacing.sm,
  },
  copyDetailChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  copyDetailChip: {
    minHeight: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  copyDetailChipText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  copyDetailEmptyTagText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  copyDetailMoreTagsText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  copyDetailModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: spacing.lg,
    paddingTop: 72,
  },
  copyDetailMenuCard: {
    width: 250,
    borderRadius: 24,
    backgroundColor: colors.card,
    paddingVertical: 6,
    shadowColor: '#1F2440',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  copyDetailMenuItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  copyDetailMenuItemDanger: {
    marginTop: 2,
  },
  copyDetailMenuText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  copyDetailMenuTextDanger: {
    color: colors.danger,
  },
  copyDetailConfirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: colors.card,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#1F2440',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  copyDetailConfirmTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  copyDetailConfirmText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  copyDetailConfirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
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
  reviewEmptyButton: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.72,
  },
});
