import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, Icon, Icons, ScreenFrame, SectionTitle, StatGrid } from '@/features/correctai/components/ui';
import { classes, exams, examClassScores, professorTabs, students } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { ClassRoom, Student } from '@/features/correctai/types';
import { ProfessorScreenProps, studentClassLabels, studentDisplayName, styles, tabPress } from './shared';
import { StudentCard } from './shared-components';

const { colors } = correctAiTheme;

function MetricBox({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <View style={styles.profMetricBox}>
      <Text style={[styles.profMetricValue, { color }]}>{value}</Text>
      <Text style={styles.profMetricLabel}>{label}</Text>
    </View>
  );
}

function QuickCard({ icon, label, desc, color, onPress }: { icon: any; label: string; desc: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.profQuickCard, pressed && { opacity: 0.7 }]}>
      <View style={[styles.profQuickIcon, { backgroundColor: color + '18' }]}>
        <Icon name={icon} color={color} size={18} />
      </View>
      <View style={styles.profQuickText}>
        <Text style={styles.profQuickLabel}>{label}</Text>
        <Text style={styles.profQuickDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

export function ProfessorHomeScreen({
  activeTab,
  onNavigate,
  classesData,
  examsData,
  studentsData,
}: ProfessorScreenProps) {
  const examList = examsData ?? exams;
  const studentList = studentsData ?? students;
  const classList = classesData ?? classes;
  const totalStudents = studentList.length;
  const totalExams = examList.length;
  const totalClasses = classList.length;
  const totalCopies = examList.reduce((sum, e) => sum + e.copies, 0);

  const homeStats = useMemo(
    () => [
      { label: 'Classes', value: String(totalClasses), tone: 'primary' as const },
      { label: 'Examens', value: String(totalExams), tone: 'primary' as const },
      { label: 'Copies', value: String(totalCopies), tone: 'primary' as const },
    ],
    [totalClasses, totalCopies, totalExams],
  );

  const classNames = useMemo(() => classList.map((c) => c.name), [classList]);

  const examColors = ['#6C5CFF', '#00B884', '#F2A000', '#F04452', '#2F80D1', '#A855F7'];

  const chartLines = useMemo(() => {
    const validScores = examClassScores.filter((s) => classNames.includes(s.className));
    const examIds = [...new Set(validScores.map((s) => s.examId))];
    return examIds.map((examId, ei) => {
      const name = validScores.find((s) => s.examId === examId)?.examName ?? examId;
      const scores = classNames.map((cn) => {
        const found = validScores.find((s) => s.examId === examId && s.className === cn);
        return { className: cn, score: found?.averageScore ?? null };
      });
      return { examId, examName: name, scores, color: examColors[ei % examColors.length] };
    });
  }, [classNames]);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; examName: string; className: string; score: number } | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const chartH = 180;
  const leftPad = 28;
  const rightPad = 8;
  const topPad = 8;
  const bottomPad = 44;

  function getX(index: number, count: number, w: number) {
    const innerW = w - leftPad - rightPad;
    return leftPad + (count > 1 ? (index / (count - 1)) * innerW : innerW / 2);
  }

  function getY(score: number, h: number) {
    const innerH = h - topPad - bottomPad;
    return topPad + (1 - Math.max(0, Math.min(20, score)) / 20) * innerH;
  }

  function renderChart() {
    if (chartWidth === 0 || classNames.length < 2 || chartLines.length === 0) {
      return <View style={{ height: chartH }} />;
    }
    const innerH = chartH - topPad - bottomPad;

    const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    const dots: { cx: number; cy: number; score: number; className: string; examName: string; color: string; examIndex: number }[] = [];

    chartLines.forEach((exam) => {
      let prevX: number | null = null;
      let prevY: number | null = null;
      exam.scores.forEach((s, si) => {
        if (s.score === null) return;
        const x = getX(si, classNames.length, chartWidth);
        const y = getY(s.score, chartH);
        if (prevX !== null && prevY !== null) {
          segments.push({ x1: prevX, y1: prevY, x2: x, y2: y, color: exam.color });
        }
        dots.push({ cx: x, cy: y, score: s.score, className: s.className, examName: exam.examName, color: exam.color, examIndex: 0 });
        prevX = x;
        prevY = y;
      });
    });

    return (
      <View style={{ height: chartH, position: 'relative' }}>
        {[0, 5, 10, 15, 20].map((tick) => {
          const y = getY(tick, chartH);
          return (
            <View key={tick} style={{ position: 'absolute', left: 0, right: 0, top: y, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ width: leftPad - 4, textAlign: 'right', fontSize: 10, fontWeight: '700', color: colors.faint }}>{tick}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
          );
        })}

        {segments.map((seg, i) => {
          const dx = seg.x2 - seg.x1;
          const dy = seg.y2 - seg.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View key={`seg-${i}`} style={{ position: 'absolute', left: seg.x1, top: seg.y1, width: length, height: 2.5, backgroundColor: seg.color, transform: [{ rotate: `${angle}deg` }], transformOrigin: 'left center' }} />
          );
        })}

        {dots.map((dot, i) => (
          <Pressable
            key={`dot-${i}`}
            onPress={() => setTooltip({ x: dot.cx, y: dot.cy - 12, examName: dot.examName, className: dot.className, score: dot.score })}
            hitSlop={10}>
            <View style={{ position: 'absolute', left: dot.cx - 6, top: dot.cy - 6, width: 12, height: 12, borderRadius: 6, backgroundColor: dot.color, borderWidth: 2.5, borderColor: '#fff' }} />
          </Pressable>
        ))}

        {classNames.map((name, i) => (
          <Text key={name} style={{ position: 'absolute', left: getX(i, classNames.length, chartWidth) - 48, top: chartH - bottomPad + 8, width: 96, textAlign: 'center', fontSize: 9, fontWeight: '700', color: colors.muted, lineHeight: 13 }} numberOfLines={2}>
            {name.replace('2 eme ', '2e ')}
          </Text>
        ))}

        {tooltip && (
          <Pressable style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} onPress={() => setTooltip(null)}>
            <View style={{ position: 'absolute', left: Math.max(8, Math.min(tooltip.x - 56, chartWidth - 120)), top: Math.max(0, tooltip.y - 52), backgroundColor: '#1C1E2E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 112, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{tooltip.examName}</Text>
              <Text style={{ color: '#A1A7B4', fontSize: 10, marginTop: 2 }}>{tooltip.className}</Text>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 3 }}>{tooltip.score}/20</Text>
            </View>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Bonjour, Professeur"
      onTabPress={tabPress(onNavigate)}
      tabs={professorTabs}>
      <StatGrid items={homeStats} />

      {chartLines.length > 0 && classNames.length >= 2 ? (
        <Card title="Performance par examen" style={styles.profChartCard}>
          <View style={styles.profLegend}>
            {chartLines.map((exam) => (
              <View key={exam.examId} style={styles.profLegendItem}>
                <View style={[styles.profLegendDot, { backgroundColor: exam.color }]} />
                <Text style={styles.profLegendLabel}>{exam.examName}</Text>
              </View>
            ))}
          </View>
          <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>{renderChart()}</View>
        </Card>
      ) : null}

      <View style={styles.profMetricsRow}>
        <MetricBox value={totalStudents} label="Etudiants" color={colors.primary} />
        <MetricBox value={totalExams} label="Examens" color={colors.info} />
      </View>

      <SectionTitle>Actions rapides</SectionTitle>
      <View style={styles.profQuickGrid}>
        <QuickCard icon={Icons.plus} label="Nouvelle classe" desc="Creer une classe" color={colors.primary} onPress={() => onNavigate('professor-classes')} />
        <QuickCard icon={Icons.doc} label="Nouvel examen" desc="Planifier un examen" color={colors.success} onPress={() => onNavigate('professor-new-exam')} />
        <QuickCard icon={Icons.people} label="Etudiants" desc="Gerer les etudiants" color={colors.info} onPress={() => onNavigate('professor-students')} />
        <QuickCard icon={Icons.chart} label="Statistiques" desc="Voir les stats" color={colors.warning} onPress={() => onNavigate('professor-account')} />
      </View>
    </ScreenFrame>
  );
}
