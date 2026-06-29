import { StyleSheet, Text, View, Pressable } from 'react-native';

import {
  Avatar,
  Icon,
  Icons,
  StatusPill,
} from '@/features/correctai/components/ui';
import { correctAiTheme } from '@/features/correctai/theme';
import type {
  Admin,
  AdminCreateInput,
  AdminStatus,
  AppScreen,
  Establishment,
  EstablishmentStatus,
  NavItem,
  Professor,
  ProfessorCreateInput,
  ProfessorStatus,
  StatItem,
  Tone,
} from '@/features/correctai/types';

const { colors, spacing, radius } = correctAiTheme;

export type SuperAdminScreenProps = {
  activeTab: NavItem['id'];
  onNavigate: (screen: AppScreen) => void;
  establishmentsData: Establishment[];
  onSelectEstablishment?: (establishment: Establishment) => void;
  selectedEstablishment?: Establishment | null;
  onCreateEstablishment?: (draft: any) => void;
  onUpdateEstablishment?: (establishment: Establishment) => void;
  onDeleteEstablishment?: (establishmentId: string) => void;
  adminsData?: Admin[];
  onSelectAdmin?: (admin: Admin) => void;
  selectedAdmin?: Admin | null;
  onCreateAdmin?: (draft: AdminCreateInput) => void;
  onUpdateAdmin?: (admin: Admin) => void;
  onDeleteAdmin?: (adminId: string) => void;
  professorsData?: Professor[];
  onSelectProfessor?: (professor: Professor) => void;
  selectedProfessor?: Professor | null;
  onCreateProfessor?: (draft: ProfessorCreateInput) => void;
  onUpdateProfessor?: (professor: Professor) => void;
  onDeleteProfessor?: (professorId: string) => void;
  classesCount?: number;
  studentsCount?: number;
  examsCount?: number;
  copiesCount?: number;
};

export function statusTone(status: EstablishmentStatus): Tone {
  if (status === 'ACTIF') return 'success';
  if (status === 'SUSPENDU') return 'warning';
  return 'neutral';
}

export function normalizeSearch(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchesEstablishmentSearch(est: Establishment, query: string) {
  if (!query) return true;
  const haystack = normalizeSearch(`${est.name} ${est.city} ${est.adminName} ${est.adminEmail}`);
  return haystack.includes(query);
}

export function AdminCard({ admin, onPress }: { admin: Admin; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.estCard, pressed && styles.pressed]}>
      <View style={styles.estHeader}>
        <View style={styles.estTitleRow}>
          <Avatar initials={admin.initials} size={32} />
          <Text style={styles.estName}>{admin.name}</Text>
        </View>
        <StatusPill label={admin.status} tone={statusTone(admin.status)} />
      </View>
      <View style={styles.estBody}>
        <Text style={styles.estAdmin}>{admin.email}</Text>
      </View>
    </Pressable>
  );
}

export function ProfessorCard({ professor, onPress }: { professor: Professor; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.estCard, pressed && styles.pressed]}>
      <View style={styles.estHeader}>
        <View style={styles.estTitleRow}>
          <Avatar initials={professor.initials} size={32} />
          <Text style={styles.estName}>{professor.name}</Text>
        </View>
        <StatusPill label={professor.status} tone={statusTone(professor.status)} />
      </View>
      <View style={styles.estBody}>
        <Text style={styles.estAdmin}>{professor.email}</Text>
        <Text style={styles.estCity}>{professor.establishment}</Text>
      </View>
    </Pressable>
  );
}

export function EstablishmentCard({ establishment, onPress }: { establishment: Establishment; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.estCard, pressed && styles.pressed]}>
      <View style={styles.estHeader}>
          <View style={styles.estTitleRow}>
              <Icon name={Icons.business} size={18} color={colors.primary} />
              <Text style={styles.estName}>{establishment.name}</Text>
          </View>
          <StatusPill label={establishment.status} tone={statusTone(establishment.status)} />
      </View>
      <View style={styles.estBody}>
          <Text style={styles.estCity}>{establishment.city}</Text>
          <Text style={styles.estAdmin}>{establishment.adminName}</Text>
      </View>
      <View style={styles.estFooter}>
          <View style={styles.estStat}>
              <Icon name={Icons.people} size={14} color={colors.muted} />
              <Text style={styles.estStatText}>{establishment.professorsCount} profs</Text>
          </View>
          <View style={styles.estStat}>
              <Icon name={Icons.school} size={14} color={colors.muted} />
              <Text style={styles.estStatText}>{establishment.studentsCount} etudiants</Text>
          </View>
      </View>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  page: { flex: 1 },
  listView: { flex: 1 },
  list: { paddingBottom: 100, gap: spacing.md },
  listEmpty: { flexGrow: 1, justifyContent: 'flex-start' },
  header: { gap: spacing.md, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  metaLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  listCard: { gap: spacing.md },
  fabWrap: { position: 'absolute', right: spacing.md },
  fabButton: { marginTop: 0 },
  profileCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  profileName: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: spacing.xs },
  profileEmail: { color: colors.muted, fontSize: 13 },
  form: { gap: spacing.md },
  formHint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  formError: { color: colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  emptyCard: { width: '100%', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  pressed: { opacity: 0.72 },
  estCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  estHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  estName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  estBody: { gap: 2 },
  estCity: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  estAdmin: { color: colors.faint, fontSize: 13 },
  estFooter: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  estStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  estStatText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  adminCard: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  adminInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  adminName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  adminEmail: { color: colors.muted, fontSize: 13 },
  sectionHint: { color: colors.muted, fontSize: 14, marginBottom: spacing.sm, marginTop: -spacing.sm },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileMeta: { flex: 1, minWidth: 0, gap: 3 },
  profileEstablishment: { color: colors.muted, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  credentialsCard: { gap: spacing.xs },
  actions: { gap: spacing.sm },
  fabContainer: { marginTop: spacing.lg },
  formTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  row: { flexDirection: 'row', gap: spacing.sm },
  fieldHalf: { flex: 1, minWidth: 0, gap: spacing.xs },
  pickerWrap: { gap: spacing.xs },
  pickerLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  pickerOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pickerChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.neutralSoft, borderWidth: 1, borderColor: colors.border },
  pickerChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pickerChipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  pickerChipTextActive: { color: colors.primary },
  statusRow: { gap: spacing.xs },
  statusButton: { alignSelf: 'flex-start' },
  statusHint: { color: colors.faint, fontSize: 12 },
  overviewCard: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  overviewItem: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  overviewDivider: { width: 1, height: 40, backgroundColor: colors.border },
  overviewValue: { color: colors.ink, fontSize: 26, fontWeight: '900' },
  overviewLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
});
