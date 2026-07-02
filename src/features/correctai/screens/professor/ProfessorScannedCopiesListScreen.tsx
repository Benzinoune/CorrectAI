import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Card,
  Icon,
  Icons,
  PrimaryButton,
  ScreenFrame,
  StatusPill,
} from '@/features/correctai/components/ui';
import { exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, ClassRoom, Exam, ScannedCopy, TabId } from '@/features/correctai/types';
import {
  buildCopyCorrectionSummary,
  formatScannedCopyDateTime,
  formatScoreValue,
  reviewStatusLabel,
  reviewStatusTone,
} from './shared';

const { colors, spacing, radius } = correctAiTheme;

type ReviewCopiesProps = {
  activeTab?: TabId;
  classesData?: ClassRoom[];
  onNavigate: (screen: AppScreen) => void;
  onSelectScannedCopy?: (copy: ScannedCopy) => void;
  onUpdateExam?: (exam: Exam) => void;
  selectedExam?: Exam | null;
  selectedScannedCopy?: ScannedCopy | null;
};

type ReviewFilter = 'all' | 'pending' | 'corrected' | 'validated';
type ReviewSort = 'date-desc' | 'date-asc' | 'score-desc' | 'name-asc';

function calculateReviewMetrics(copies: ScannedCopy[]) {
  const total = copies.length;
  if (total === 0) return { total: 0, pending: 0, corrected: 0, validated: 0, averageScore: 0 };
  const pending = copies.filter((c) => c.reviewStatus === 'DETECTED' || c.reviewStatus === 'PENDING').length;
  const corrected = copies.filter((c) => c.reviewStatus === 'CORRECTED').length;
  const validated = copies.filter((c) => c.reviewStatus === 'VALIDATED').length;
  let scoreSum = 0;
  let scoredCount = 0;
  copies.forEach((c) => {
    if (c.calculatedScore && c.calculatedScore.includes('/')) {
      const [score, max] = c.calculatedScore.split('/').map(Number);
      if (!isNaN(score) && !isNaN(max) && max > 0) {
        scoreSum += (score / max) * 100;
        scoredCount += 1;
      }
    }
  });
  const averageScore = scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0;
  return { total, pending, corrected, validated, averageScore };
}

function ScannedCopyListCard({
  copy,
  exam,
  onPress,
}: {
  copy: ScannedCopy;
  exam: Exam;
  onPress: () => void;
}) {
  const correctionSummary = useMemo(() => buildCopyCorrectionSummary(exam, copy), [copy, exam]);
  const isPending = copy.reviewStatus === 'DETECTED' || copy.reviewStatus === 'PENDING';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.reviewCopyRow,
        isPending && styles.reviewCopyRowActive,
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.reviewCopyStripe,
          { backgroundColor: isPending ? colors.primary : colors.neutralSoft },
        ]}
      />
      <View style={styles.reviewCopyPreviewWrap}>
        <View style={styles.reviewCopyThumbnail}>
          {copy.imageUri ? (
            <Image
              source={{ uri: copy.imageUri }}
              resizeMode="cover"
              style={styles.reviewCopyThumbnailImage}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={Icons.camera} color={colors.faint} size={24} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.reviewCopyRowMain}>
        <Text numberOfLines={1} style={styles.reviewCopyName}>
          {copy.studentName || 'Non identifié'}
        </Text>
        <Text numberOfLines={1} style={styles.reviewCopyMeta}>
          Matricule {copy.matricule || '0'} · {copy.examName}
        </Text>
        <View style={styles.reviewCopyBadgeRow}>
          <StatusPill label={reviewStatusLabel(copy.reviewStatus)} tone={reviewStatusTone(copy.reviewStatus)} />
          {copy.aiConfidence < 70 ? <StatusPill label="Confiance faible" tone="warning" /> : null}
        </View>
        <Text numberOfLines={1} style={styles.reviewCopySubmeta}>
          {formatScannedCopyDateTime(copy.scannedAt)}
        </Text>
      </View>
      <View style={styles.reviewCopySide}>
        <Text style={styles.reviewCopyCount}>
          {correctionSummary ? formatScoreValue(correctionSummary.totalPoints) : '--'}
        </Text>
        <Text style={styles.reviewCopyCountLabel}>
          / {correctionSummary ? formatScoreValue(correctionSummary.maxPoints) : '--'}
        </Text>
      </View>
    </Pressable>
  );
}

export function ProfessorScannedCopiesListScreen({
  onNavigate,
  onSelectScannedCopy,
  selectedExam,
}: ReviewCopiesProps) {
  const exam = selectedExam ?? exams[0] ?? null;
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [sort, setSort] = useState<ReviewSort>('date-desc');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const copies = useMemo(() => {
    if (!exam?.scannedCopies) return [];
    let result = [...exam.scannedCopies];
    if (filter === 'pending') result = result.filter((c) => c.reviewStatus === 'DETECTED' || c.reviewStatus === 'PENDING');
    if (filter === 'corrected') result = result.filter((c) => c.reviewStatus === 'CORRECTED');
    if (filter === 'validated') result = result.filter((c) => c.reviewStatus === 'VALIDATED');
    result.sort((a, b) => {
      if (sort === 'date-desc') return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
      if (sort === 'date-asc') return new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime();
      if (sort === 'name-asc') return (a.studentName || '').localeCompare(b.studentName || '');
      if (sort === 'score-desc') {
        const scoreA = parseFloat(a.calculatedScore?.split('/')[0] || '0');
        const scoreB = parseFloat(b.calculatedScore?.split('/')[0] || '0');
        return scoreB - scoreA;
      }
      return 0;
    });
    return result;
  }, [exam?.scannedCopies, filter, sort]);

  const metrics = useMemo(() => calculateReviewMetrics(exam?.scannedCopies ?? []), [exam?.scannedCopies]);
  const pendingCount = metrics.pending;

  useEffect(() => {
    console.log(
      '[ScanHistory] render state: examId=%s copyCount=%d filter=%s sort=%s',
      exam?.id ?? 'none',
      exam?.scannedCopies?.length ?? 0,
      filter,
      sort,
    );
  }, [exam?.id, exam?.scannedCopies?.length, filter, sort]);

  if (!exam) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-exams')} title="Copies scannées">
        <Card icon={Icons.info} style={styles.listCard} title="Aucun examen sélectionné">
          <Text style={styles.emptyText}>Sélectionnez un examen pour voir ses copies scannées.</Text>
          <PrimaryButton
            icon={Icons.folder}
            onPress={() => onNavigate('professor-exams')}
            style={styles.reviewEmptyButton}>
            Voir mes examens
          </PrimaryButton>
        </Card>
      </ScreenFrame>
    );
  }

  const handleCopyPress = (copy: ScannedCopy) => {
    console.log(
      '[ScanHistory] open copy: copyId=%s examId=%s student=%s',
      copy.id,
      copy.examId,
      copy.studentName,
    );
    onSelectScannedCopy?.(copy);
    onNavigate('professor-copy-detail');
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'all': return 'Toutes les copies';
      case 'pending': return 'À vérifier';
      case 'corrected': return 'Corrigées';
      case 'validated': return 'Validées';
    }
  };

  return (
    <ScreenFrame
      compactHeader
      onBack={() => onNavigate('professor-exam-menu')}
      scrollable={false}
      title="Historique des scans">
      <View style={styles.reviewPage}>
        <View style={styles.reviewHeroBlock}>
          <View style={styles.reviewHeroHeaderRow}>
            <View style={styles.reviewHeroIconWrap}>
              <Icon name={Icons.doc} color={colors.card} size={24} />
            </View>
            <View style={styles.reviewHeroTextBlock}>
              <Text numberOfLines={1} style={styles.reviewHeroTitle}>
                {exam.name}
              </Text>
              <Text numberOfLines={1} style={styles.reviewHeroSubtitle}>
                {metrics.total} copies scannées
              </Text>
            </View>
          </View>
          <View style={styles.reviewHeroStatsRow}>
            <View style={styles.reviewHeroStat}>
              <Text style={styles.reviewHeroStatValue}>{pendingCount}</Text>
              <Text style={styles.reviewHeroStatLabel}>À vérifier</Text>
            </View>
            <View style={styles.reviewHeroStat}>
              <Text style={styles.reviewHeroStatValue}>{metrics.validated}</Text>
              <Text style={styles.reviewHeroStatLabel}>Validées</Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewMetricsStrip}>
          <View style={styles.reviewMetricCell}>
            <Text style={[styles.reviewMetricValue, pendingCount > 0 ? styles.reviewMetricWarning : styles.reviewMetricSuccess]}>
              {pendingCount > 0 ? pendingCount : 'OK'}
            </Text>
            <Text style={styles.reviewMetricLabel}>Action requise</Text>
          </View>
          <View style={styles.reviewMetricCell}>
            <Text style={styles.reviewMetricValue}>{metrics.averageScore}%</Text>
            <Text style={styles.reviewMetricLabel}>Moyenne</Text>
          </View>
        </View>

        <View style={styles.reviewControlsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterModalVisible(true)}
            style={({ pressed }) => [styles.reviewFilterPill, pressed && styles.pressed]}>
            <Icon name={Icons.filter} color={colors.primary} size={18} />
            <Text style={styles.reviewFilterLabel}>Filtre :</Text>
            <Text numberOfLines={1} style={styles.reviewFilterValue}>
              {getFilterLabel()}
            </Text>
            <Icon name={Icons.chevronDown} color={colors.muted} size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSort((s) => (s === 'date-desc' ? 'score-desc' : 'date-desc'))}
            style={({ pressed }) => [
              styles.reviewSortButton,
              sort === 'score-desc' && styles.reviewSortButtonActive,
              pressed && styles.pressed,
            ]}>
            <Icon name={Icons.chart} color={sort === 'score-desc' ? colors.primary : colors.muted} size={18} />
          </Pressable>
        </View>

        <FlatList
          data={copies}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ScannedCopyListCard copy={item} exam={exam} onPress={() => handleCopyPress(item)} />}
          contentContainerStyle={styles.reviewListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.reviewEmptyHistoryCard}>
              <Icon name={Icons.doc} color={colors.faint} size={48} />
              <Text style={styles.reviewEmptyText}>Aucune copie scannée trouvée.</Text>
            </View>
          }
        />
      </View>

      <Modal animationType="fade" transparent visible={filterModalVisible} onRequestClose={() => setFilterModalVisible(false)}>
        <Pressable style={styles.reviewFilterModalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.reviewFilterModalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.reviewFilterModalHeader}>
              <Text style={styles.reviewFilterModalTitle}>Filtrer les copies</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFilterModalVisible(false)}
                style={({ pressed }) => [styles.reviewFilterModalClose, pressed && styles.pressed]}>
                <Icon name={Icons.close} color={colors.ink} size={18} />
              </Pressable>
            </View>

            <View style={styles.reviewFilterOptions}>
              {[
                { id: 'all', label: 'Toutes les copies' },
                { id: 'pending', label: 'À vérifier' },
                { id: 'corrected', label: 'Corrigées' },
                { id: 'validated', label: 'Validées' },
              ].map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setFilter(option.id as ReviewFilter);
                    setFilterModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.reviewFilterOption,
                    filter === option.id && styles.reviewFilterOptionActive,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.reviewFilterOptionCheck, filter === option.id && styles.reviewFilterOptionCheckActive]}>
                    {filter === option.id && <Icon name={Icons.check} color={colors.card} size={14} />}
                  </View>
                  <Text style={styles.reviewFilterOptionLabel}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  listCard: { gap: spacing.sm, paddingVertical: spacing.sm },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  reviewEmptyButton: { alignSelf: 'flex-start' },
  reviewPage: { flex: 1, minHeight: 0, gap: spacing.md },
  reviewListContent: { gap: spacing.sm, paddingBottom: spacing.xxl },
  reviewHeroBlock: {
    borderRadius: 24,
    backgroundColor: colors.primary,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  reviewHeroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeroTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  reviewHeroTitle: {
    color: colors.card,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 26,
  },
  reviewHeroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  reviewHeroStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reviewHeroStat: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  reviewHeroStatValue: {
    color: colors.card,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  reviewHeroStatLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewMetricsStrip: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1F2440',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  reviewMetricCell: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.sm,
  },
  reviewMetricValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  reviewMetricSuccess: {
    color: colors.success,
  },
  reviewMetricDanger: {
    color: colors.danger,
  },
  reviewMetricWarning: {
    color: '#E08B00',
  },
  reviewMetricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewFilterPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reviewFilterLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  reviewFilterValue: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewSortButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSortButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  reviewEmptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewEmptyHistoryCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  reviewFilterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  reviewFilterModalCard: {
    width: '100%',
    maxWidth: 380,
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
  reviewFilterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  reviewFilterModalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  reviewFilterModalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewFilterOptions: {
    gap: spacing.xs,
  },
  reviewFilterOption: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reviewFilterOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  reviewFilterOptionCheck: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  reviewFilterOptionCheckActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reviewFilterOptionLabel: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewCopyRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.sm,
    paddingLeft: spacing.sm + 2,
    shadowColor: '#1F2440',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  reviewCopyRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  reviewCopyStripe: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderRadius: 999,
  },
  reviewCopyPreviewWrap: {
    width: 68,
    height: 68,
    flexShrink: 0,
  },
  reviewCopyThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.screen,
    overflow: 'hidden',
  },
  reviewCopyThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  reviewCopyRowMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  reviewCopyName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  reviewCopyMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  reviewCopyBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  reviewCopyProgressLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  reviewCopySubmeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  reviewCopySide: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    minWidth: 64,
  },
  reviewCopyCount: {
    color: colors.danger,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 28,
  },
  reviewCopyCountLabel: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  copyPreviewFrame: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: 14,
    backgroundColor: '#FCFCFF',
    borderWidth: 1,
    borderColor: '#E5E8F4',
    padding: 8,
    shadowColor: '#1F2440',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  copyPreviewFrameCompact: {
    aspectRatio: 0.9,
    padding: 6,
  },
  copyPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  copyPreviewHeaderLine: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    marginRight: 4,
  },
  copyPreviewHeaderBadge: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  copyPreviewBody: {
    gap: 6,
  },
  copyPreviewRow: {
    flexDirection: 'row',
    gap: 4,
  },
  copyPreviewBubble: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#E7E9F4',
  },
  pressed: {
    opacity: 0.72,
  },
});
