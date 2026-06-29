import { Pressable, Text, View } from 'react-native';

import { Card, Icons, ScreenFrame, StatusPill } from '@/features/correctai/components/ui';
import { studentExams, studentTabs } from '@/features/correctai/data/mock-data';
import type { Tone } from '@/features/correctai/types';
import { StudentScreenProps, styles, tabPress } from './shared';

export function StudentExamsScreen({ activeTab, onNavigate }: StudentScreenProps) {
  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Mes examens"
      onTabPress={tabPress(onNavigate)}
      tabs={studentTabs}>
      <View style={styles.examCards}>
        {studentExams.map((exam) => (
          <Pressable
            accessibilityRole="button"
            key={exam.id}
            onPress={() => onNavigate('student-exam-result')}
            style={({ pressed }) => [styles.pressedCard, pressed && styles.pressed]}>
            <Card icon={Icons.doc} style={styles.studentExamCard} title={exam.title} subtitle={exam.date}>
              <View style={styles.examStatusRow}>
                <StatusPill label={exam.score ?? exam.status ?? ''} tone={exam.tone as Tone} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenFrame>
  );
}
