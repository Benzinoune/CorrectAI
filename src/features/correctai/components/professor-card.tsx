import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Card, Icon, Icons, StatusPill } from '@/features/correctai/components/ui';
import { correctAiTheme } from '@/features/correctai/theme';
import type { Professor, Tone } from '@/features/correctai/types';

const { colors, spacing } = correctAiTheme;

type ProfessorCardProps = {
  professor: Professor;
  statusTone: Tone;
  onPress: () => void;
};

export function ProfessorCard({ professor, statusTone, onPress }: ProfessorCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Avatar initials={professor.initials} size={52} />
          <View style={styles.meta}>
            <Text numberOfLines={1} style={styles.name}>
              {professor.name}
            </Text>
            <Text numberOfLines={1} style={styles.email}>
              {professor.email}
            </Text>
            <Text numberOfLines={1} style={styles.establishment}>
              {professor.establishment}
            </Text>
          </View>
          <StatusPill label={professor.status} tone={statusTone} />
        </View>

        <View style={styles.stats}>
          {professor.stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.hint}>
            <Icon name={Icons.school} color={colors.muted} size={14} />
            <Text style={styles.hintText}>Ouvrir le profil</Text>
          </View>
          <Icon name={Icons.chevron} color={colors.primary} size={18} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: 14,
  },
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  email: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  establishment: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stat: {
    flex: 1,
    minHeight: 58,
    backgroundColor: colors.screen,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  statValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hintText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
