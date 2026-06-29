import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Icon, Icons, InfoRow, PrimaryButton, ScreenFrame, SegmentedControl } from '@/features/correctai/components/ui';
import { classes, exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import { classNamesFromIds, getResponseSheetOptionFromQuestions, ProfessorScreenProps, scannedCopiesCount, styles } from './shared';

const { colors, spacing, radius } = correctAiTheme;

const localStyles = StyleSheet.create({
  nameLine: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  nameAccent: {
    color: '#13935E',
  },
  infoCard: {
    paddingVertical: 0,
    ...{
      shadowColor: '#1F2440',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
  },
  examMenuResponseRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  examMenuResponseTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  examMenuResponseLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  examMenuResponseValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  examMenuResponseValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  examMenuResponseAction: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function ProfessorExamMenuScreen({
  classesData,
  examsData,
  onNavigate,
  onSelectExam,
  onSetScannerMode,
  onDeleteExam,
  selectedExam,
}: ProfessorScreenProps) {
  const examList = examsData ?? exams;
  const classList = classesData ?? classes;
  const exam = selectedExam ?? examList[0] ?? null;
  const [segment, setSegment] = useState<'details' | 'statistics'>('details');

  const examStats = useMemo(() => {
    if (!exam?.scannedCopies?.length) return { min: 0, max: 0, avg: 0, minPct: 0, maxPct: 0, avgPct: 0, count: 0 };
    const allScores: number[] = [];
    exam.scannedCopies.forEach((copy) => {
      if (!copy.calculatedScore || copy.calculatedScore === '--') return;
      const match = copy.calculatedScore.match(/([\d.]+)\//);
      if (match) allScores.push(parseFloat(match[1]));
    });
    if (allScores.length === 0) return { min: 0, max: 0, avg: 0, minPct: 0, maxPct: 0, avgPct: 0, count: 0 };
    const min = Math.min(...allScores);
    const max = Math.max(...allScores);
    const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const maxPossible = 20;
    return { min, max, avg, minPct: (min / maxPossible) * 100, maxPct: (max / maxPossible) * 100, avgPct: (avg / maxPossible) * 100, count: allScores.length };
  }, [exam]);

  const handleDelete = () => {
    if (!exam) return;
    Alert.alert('Supprimer', `Supprimer ${exam.name} ? Cette action supprime toutes les copies scannées.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { onDeleteExam?.(exam.id); onNavigate('professor-exams'); } },
    ]);
  };

  if (!exam) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-exams')} title="Menu Examen">
        <Card icon={Icons.info} style={styles.listCard} title="Aucun examen disponible">
          <Text style={styles.emptyText}>Ajoutez un examen pour afficher ses details.</Text>
        </Card>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      compactHeader
      onBack={() => onNavigate('professor-exams')}
      rightAction={{ icon: Icons.edit, onPress: () => onNavigate('professor-new-exam') }}
      title="Menu Examen">
      <Text style={localStyles.nameLine}>
        Name : <Text style={localStyles.nameAccent}>{exam.name}</Text>
      </Text>
      <SegmentedControl
        active={segment}
        onChange={(value) => setSegment(value as 'details' | 'statistics')}
        options={[
          { id: 'details', label: 'DETAILS' },
          { id: 'statistics', label: 'STATISTICS' },
        ]}
      />
      {segment === 'details' ? (
        <Card icon={Icons.doc} style={localStyles.infoCard} title="Informations examen">
          <InfoRow label="Matière" tone="primary" value={exam.subject} />
          <InfoRow
            label="Classes"
            tone="primary"
            value={exam.classIds?.length ? classNamesFromIds(exam.classIds, classList).join(', ') : exam.className}
          />
          <View style={localStyles.examMenuResponseRow}>
            <View style={localStyles.examMenuResponseTextBlock}>
              <Text style={localStyles.examMenuResponseLabel}>Feuille de réponse</Text>
              <View style={localStyles.examMenuResponseValueRow}>
                <Icon name={Icons.doc} color={colors.primary} size={15} />
                <Text style={localStyles.examMenuResponseValue}>
                  {getResponseSheetOptionFromQuestions(exam.questions).label}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onSelectExam?.(exam);
                onNavigate('professor-answer-sheet');
              }}
              style={({ pressed }) => [localStyles.examMenuResponseAction, pressed && styles.pressed]}>
              <Icon name={Icons.printer} color={colors.primary} size={18} />
            </Pressable>
          </View>
          <InfoRow icon={Icons.calendar} label="Date" tone="primary" value={exam.date} />
          <InfoRow
            icon={Icons.copy}
            label="Copies scannées"
            tone="success"
            value={`${scannedCopiesCount(exam)} copies`}
          />
          <InfoRow icon={Icons.info} label="Questions" tone="primary" value={`${exam.questions} questions`} />
        </Card>
      ) : (
        <Card icon={Icons.chart} style={localStyles.infoCard} title="Score - Pourcentage">
          <InfoRow label="Note min." value={`${examStats.min.toFixed(1)} / ${examStats.minPct.toFixed(1)}%`} />
          <InfoRow label="Note max." value={`${examStats.max.toFixed(1)} / ${examStats.maxPct.toFixed(1)}%`} />
          <InfoRow label="Moyenne" value={`${examStats.avg.toFixed(1)} / ${examStats.avgPct.toFixed(1)}%`} />
          <InfoRow label="Copies corrigees" value={String(examStats.count)} />
        </Card>
      )}
      <PrimaryButton icon={Icons.key} onPress={() => onNavigate('professor-answer-key')}>
        MODIFIER LE CORRIGE
      </PrimaryButton>
      <PrimaryButton
        icon={Icons.camera}
        onPress={() => {
          onSetScannerMode?.('copies');
          onNavigate('professor-scanner');
        }}
        tone="success">
        SCANNER LES COPIES
      </PrimaryButton>
      <PrimaryButton icon={Icons.doc} onPress={() => onNavigate('professor-review-copies')} tone="warning">
        REVISER LES COPIES
      </PrimaryButton>
      <PrimaryButton icon={Icons.chart} onPress={() => onNavigate('professor-account')} tone="info">
        STATISTIQUES
      </PrimaryButton>
      <PrimaryButton icon={Icons.trash} onPress={handleDelete} tone="danger" variant="soft">
        SUPPRIMER L&apos;EXAMEN
      </PrimaryButton>
    </ScreenFrame>
  );
}
