import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Card, Icons, ScreenFrame, ScoreHero, SectionTitle, StatGrid } from '@/features/correctai/components/ui';
import { exams, recentResults, studentTabs } from '@/features/correctai/data/mock-data';
import { StudentScreenProps, styles, tabPress } from './shared';

export function StudentHomeScreen({ activeTab, onNavigate, studentsData, selectedStudent, examsData }: StudentScreenProps) {
  const student = selectedStudent ?? studentsData[0];
  const greeting = student ? `Bonjour, ${student.firstName ?? student.initials}` : 'Bonjour';
  const studentExamsList = examsData ?? exams;
  const totalExams = studentExamsList.length;
  const totalPassed = studentExamsList.filter((e) => e.status === 'TERMINE').length;
  const result = recentResults;

  const stats = useMemo(() => [
    { label: 'Examens passes', value: String(totalPassed), tone: 'success' as const },
    { label: 'Examens disponibles', value: String(totalExams), tone: 'info' as const },
  ], [totalExams, totalPassed]);

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting={greeting}
      onTabPress={tabPress(onNavigate)}
      tabs={studentTabs}>
      <ScoreHero label="Bien" score={result.length > 0 ? result[0].score ?? '14.5/20' : '14.5/20'} />
      <SectionTitle>Statistiques</SectionTitle>
      <StatGrid items={stats} />
      <SectionTitle>Resultats recents</SectionTitle>
      <Card icon={Icons.chart} style={styles.resultsCard} title="Resultats recents">
        {result.map((r) => (
          <View key={r.id} style={styles.resultRow}>
            <View>
              <Text style={styles.rowTitle}>{r.title}</Text>
              <Text style={styles.rowSubtitle}>{r.date}</Text>
            </View>
            <Text style={[styles.resultScore, r.tone === 'danger' && styles.resultScoreDanger]}>
              {r.score}
            </Text>
          </View>
        ))}
      </Card>
    </ScreenFrame>
  );
}
