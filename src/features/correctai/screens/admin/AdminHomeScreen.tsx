import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PersonRow, ScreenFrame, SectionTitle, StatGrid } from '@/features/correctai/components/ui';
import { adminTabs } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { AppScreen, NavItem, Professor, ProfessorStatus, Tone } from '@/features/correctai/types';

const { colors, spacing, radius } = correctAiTheme;

type AdminScreenProps = {
  activeTab: NavItem['id'];
  adminEstablishmentId?: string;
  onNavigate: (screen: AppScreen) => void;
  onSelectProfessor?: (professor: Professor) => void;
  professorsData?: Professor[];
};

function statusTone(status: ProfessorStatus): Tone {
  if (status === 'ACTIF') return 'success';
  if (status === 'SUSPENDU') return 'warning';
  return 'neutral';
}

export function AdminHomeScreen({ activeTab, adminEstablishmentId, onNavigate, onSelectProfessor, professorsData }: AdminScreenProps) {
  const professorList = useMemo(
    () => (professorsData ?? []).filter((p) => !adminEstablishmentId || p.establishmentId === adminEstablishmentId),
    [adminEstablishmentId, professorsData],
  );

  const total = professorList.length;
  const actif = professorList.filter((p) => p.status === 'ACTIF').length;
  const suspendu = professorList.filter((p) => p.status === 'SUSPENDU').length;
  const inactif = professorList.filter((p) => p.status === 'INACTIF').length;

  const adminStats = useMemo(
    () => [
      { label: 'Professeurs', value: String(total), tone: 'primary' as const },
      { label: 'Actifs', value: String(actif), tone: 'success' as const },
      { label: 'Suspendus', value: String(suspendu), tone: 'danger' as const },
    ],
    [actif, suspendu, total],
  );

  const actifPct = total > 0 ? (actif / total) * 100 : 0;
  const suspenduPct = total > 0 ? (suspendu / total) * 100 : 0;
  const inactifPct = total > 0 ? (inactif / total) * 100 : 0;

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Bonjour, Admin"
      onTabPress={(item) => onNavigate(item.screen)}
      tabs={adminTabs}>
      <View style={styles.page}>
        <StatGrid items={adminStats} />

        {total > 0 ? (
          <Card style={styles.distribCard} title="Repartition des statuts">
            <View style={styles.barTrack}>
              {actif > 0 ? <View style={[styles.barSegment, { flex: actif, backgroundColor: colors.success }]} /> : null}
              {suspendu > 0 ? <View style={[styles.barSegment, { flex: suspendu, backgroundColor: colors.warning }]} /> : null}
              {inactif > 0 ? <View style={[styles.barSegment, { flex: inactif, backgroundColor: colors.muted }]} /> : null}
            </View>
            <View style={styles.legendRow}>
              <LegendDot color={colors.success} label={`Actifs (${actif})`} />
              <LegendDot color={colors.warning} label={`Suspendus (${suspendu})`} />
              <LegendDot color={colors.muted} label={`Inactifs (${inactif})`} />
            </View>
          </Card>
        ) : null}

        <View style={styles.metricsRow}>
          <MetricCard label="Taux d'activite" value={total > 0 ? `${Math.round(actifPct)}%` : '-'} tone={actifPct >= 50 ? colors.success : colors.warning} />
          <MetricCard label="Total profs" value={String(total)} tone={colors.primary} />
        </View>

        <View style={styles.sectionHeader}>
          <SectionTitle>Professeurs recents</SectionTitle>
        </View>
        <Card style={styles.recentCard}>
          {professorList.slice(0, 3).map((professor, index) => (
            <PersonRow
              avatarTone={index === 1 ? 'orange' : index === 2 ? 'neutral' : 'primary'}
              initials={professor.initials}
              key={professor.id}
              onPress={() => {
                onSelectProfessor?.(professor);
                onNavigate('admin-professor-detail');
              }}
              status={professor.status}
              statusTone={statusTone(professor.status)}
              subtitle={`${professor.email} · ${professor.establishment}`}
              title={professor.name}
            />
          ))}
        </Card>
      </View>
    </ScreenFrame>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.xs,
  },
  recentCard: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  distribCard: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  barTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.neutralSoft,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
