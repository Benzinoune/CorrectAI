import { useState } from 'react';
import { Text, View } from 'react-native';

import { Card, Icons, PrimaryButton, ScreenFrame } from '@/features/correctai/components/ui';
import { studentTabs, reportRows } from '@/features/correctai/data/mock-data';
import { StudentScreenProps, styles, tabPress } from './shared';

export function StudentReportScreen({ activeTab, onNavigate, studentsData, selectedStudent }: StudentScreenProps) {
  const [downloaded, setDownloaded] = useState(false);
  const student = selectedStudent ?? studentsData[0];
  const fullName = student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.initials ?? 'Etudiant';
  const reportGreeting = `Releve ${fullName}`;

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting={reportGreeting}
      onTabPress={tabPress(onNavigate)}
      tabs={studentTabs}>
      <Text style={styles.studentName}>{fullName} - {student.matricule ?? 'Terminale S1'}</Text>
      <Card icon={Icons.report} style={styles.reportCard} title="Releve 2024-2025">
        <View style={styles.reportHeader}>
          <Text style={styles.reportHeaderText}>Matiere</Text>
          <Text style={styles.reportHeaderText}>Note</Text>
          <Text style={styles.reportHeaderText}>Mention</Text>
        </View>
        {reportRows.map((row) => (
          <View key={row.subject} style={styles.reportRow}>
            <Text style={styles.reportCell}>{row.subject}</Text>
            <Text style={styles.reportCell}>{row.score}</Text>
            <Text style={styles.reportCell}>{row.mention}</Text>
          </View>
        ))}
      </Card>
      <PrimaryButton icon={Icons.download} onPress={() => setDownloaded(true)}>
        {downloaded ? 'PDF telecharge' : 'Telecharger PDF'}
      </PrimaryButton>
      {downloaded ? <Text style={styles.confirmation}>Le PDF est pret a etre partage.</Text> : null}
    </ScreenFrame>
  );
}
