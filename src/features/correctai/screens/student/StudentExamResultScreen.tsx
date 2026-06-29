import { Text, View } from 'react-native';

import { Card, Icons, ScreenFrame, StatusPill } from '@/features/correctai/components/ui';
import { StudentScreenProps, styles } from './shared';

export function StudentExamResultScreen({ onNavigate, examsData, selectedStudent }: StudentScreenProps) {
  const examTitle = examsData && examsData.length > 0 ? examsData[0].name : 'Mathematiques S2';
  return (
    <ScreenFrame compactHeader onBack={() => onNavigate('student-exams')} title={examTitle}>
      <Card icon={Icons.trophy} style={styles.bigScoreCard} title="Resultat">
        <Text style={styles.bigScore}>16</Text>
        <Text style={styles.bigScoreBase}>/20</Text>
        <StatusPill label="Bien" tone="success" />
        <Text style={styles.rankText}>Classe 3eme sur 28 etudiants</Text>
      </Card>
      <View style={styles.questionGrid}>
        {Array.from({ length: 12 }, (_, index) => {
          const correct = ![3, 7, 11].includes(index + 1);
          return (
            <View key={index + 1} style={styles.questionChip}>
              <Text style={[styles.questionText, !correct && styles.questionTextWrong]}>
                Q{index + 1} {correct ? 'OK' : 'X'}
              </Text>
            </View>
          );
        })}
      </View>
    </ScreenFrame>
  );
}
