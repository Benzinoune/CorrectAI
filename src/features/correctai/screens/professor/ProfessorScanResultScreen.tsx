import { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppScreen, Exam, ScannedCopy } from '@/features/correctai/types';

type DetectedAnswer = {
  question: number;
  answer: string | null;
  confidence: number;
};

type Props = {
  onNavigate: (screen: AppScreen) => void;
  selectedExam?: Exam | null;
  selectedScannedCopy?: ScannedCopy | null;
  onScanReset?: () => void;
};

export function ProfessorScanResultScreen(props: Props) {
  const copy = props.selectedScannedCopy;
  const exam = props.selectedExam;
  const questionCount = exam?.questions ?? 20;

  const [parsedAnswers] = useState<DetectedAnswer[]>(() => {
    if (!copy?.detectedAnswers?.length) return [];
    return copy.detectedAnswers.map((answer, i) => ({
      question: i + 1,
      answer: answer || null,
      confidence: copy.aiConfidence / 100,
    }));
  });

  const detectedCount = parsedAnswers.filter((a) => a.answer).length;
  const confidenceAvg =
    parsedAnswers.length > 0
      ? Math.round(
          (parsedAnswers.reduce((s, a) => s + a.confidence, 0) / parsedAnswers.length) * 100,
        )
      : 0;

  const handleValidate = () => {
    props.onNavigate?.('professor-copy-review');
  };

  const handleModify = () => {
    props.onNavigate?.('professor-copy-revision');
  };

  const handleRetake = () => {
    props.onScanReset?.();
    props.onNavigate?.('professor-scanner');
  };

  const renderAnswer = ({ item }: { item: DetectedAnswer }) => {
    const isFilled = !!item.answer;
    const confidencePct = Math.round(item.confidence * 100);
    const color =
      confidencePct >= 80 ? '#00B884' : confidencePct >= 50 ? '#F2A000' : '#F04452';

    return (
      <View style={styles.answerRow}>
        <Text style={styles.qNum}>Q{item.question}</Text>
        <View style={styles.bubbleRow}>
          {['A', 'B', 'C', 'D', 'E'].map((choice) => {
            const selected = item.answer === choice;
            return (
              <View
                key={choice}
                style={[
                  styles.choiceDot,
                  selected && { backgroundColor: color, borderColor: color },
                ]}
              >
                {selected && <Text style={styles.choiceText}>{choice}</Text>}
              </View>
            );
          })}
        </View>
        {isFilled && (
          <View style={[styles.confBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.confText, { color }]}>{confidencePct}%</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={handleRetake}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Résultat du scan</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.imageCard}>
          {copy?.imageUri ? (
            <Image source={{ uri: copy.imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="document-outline" size={40} color="#3F4154" />
            </View>
          )}
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{detectedCount}/{questionCount}</Text>
            <Text style={styles.statLabel}>Détectées</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{confidenceAvg}%</Text>
            <Text style={styles.statLabel}>Confiance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{copy?.studentName ?? '---'}</Text>
            <Text style={styles.statLabel}>Étudiant</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Réponses détectées</Text>

        <FlatList
          data={parsedAnswers}
          keyExtractor={(item) => String(item.question)}
          renderItem={renderAnswer}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={styles.secondaryBtn}
          onPress={handleModify}
        >
          <Ionicons name="create-outline" size={18} color="#121422" />
          <Text style={styles.secondaryBtnText}>Modifier</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.primaryBtn}
          onPress={handleValidate}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Valider</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7FC',
  },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6C5CFF',
  },
  headerBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  imageCard: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1B1831',
    marginBottom: 12,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#121422',
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    color: '#657084',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E8ECF0',
  },
  sectionTitle: {
    color: '#121422',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 6,
    paddingBottom: 80,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  qNum: {
    width: 32,
    color: '#657084',
    fontSize: 12,
    fontWeight: '700',
  },
  bubbleRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  choiceDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#D8DAEA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  choiceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  confBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1FB',
    gap: 6,
  },
  secondaryBtnText: {
    color: '#121422',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CFF',
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
