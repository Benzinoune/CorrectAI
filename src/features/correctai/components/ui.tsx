import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { correctAiTheme, phoneMaxWidth } from '@/features/correctai/theme';
import type { NavItem, StatItem, TabId, Tone, UserRole } from '@/features/correctai/types';

type IconName = ComponentProps<typeof Ionicons>['name'];
type SelectOption = {
  id: string;
  label: string;
};

const makeIcon = (name: IconName) => name;

export const Icons = {
  back: makeIcon('chevron-back'),
  plus: makeIcon('add'),
  minus: makeIcon('remove-outline'),
  addCircle: makeIcon('add-circle-outline'),
  star: makeIcon('star-outline'),
  search: makeIcon('search'),
  sort: makeIcon('swap-vertical'),
  calendar: makeIcon('calendar-outline'),
  copy: makeIcon('copy-outline'),
  doc: makeIcon('document-text-outline'),
  printer: makeIcon('print-outline'),
  share: makeIcon('share-outline'),
  camera: makeIcon('camera-outline'),
  key: makeIcon('key-outline'),
  chart: makeIcon('bar-chart-outline'),
  edit: makeIcon('pencil-outline'),
  trash: makeIcon('trash-outline'),
  lock: makeIcon('lock-closed-outline'),
  info: makeIcon('information-circle-outline'),
  gear: makeIcon('settings-outline'),
  chevron: makeIcon('chevron-forward'),
  chevronUp: makeIcon('chevron-up'),
  chevronDown: makeIcon('chevron-down'),
  more: makeIcon('ellipsis-vertical'),
  download: makeIcon('download-outline'),
  home: makeIcon('home-outline'),
  people: makeIcon('people-outline'),
  school: makeIcon('school-outline'),
  report: makeIcon('reader-outline'),
  profile: makeIcon('person-circle-outline'),
  trophy: makeIcon('trophy-outline'),
  check: makeIcon('checkmark-circle-outline'),
  mail: makeIcon('mail-outline'),
  personAdd: makeIcon('person-add-outline'),
  close: makeIcon('close-outline'),
  save: makeIcon('save-outline'),
  notifications: makeIcon('notifications-outline'),
  shield: makeIcon('shield-checkmark-outline'),
  book: makeIcon('book-outline'),
  business: makeIcon('business-outline'),
  folder: makeIcon('folder-outline'),
  filter: makeIcon('funnel-outline'),
};

const { colors, radius, spacing } = correctAiTheme;

function toneColors(tone: Tone = 'neutral') {
  switch (tone) {
    case 'primary':
      return { background: colors.primarySoft, text: colors.primary };
    case 'success':
      return { background: colors.successSoft, text: colors.success };
    case 'warning':
      return { background: colors.warningSoft, text: '#8E5600' };
    case 'danger':
      return { background: colors.dangerSoft, text: colors.danger };
    case 'info':
      return { background: colors.infoSoft, text: colors.info };
    default:
      return { background: colors.neutralSoft, text: colors.neutralText };
  }
}

function statIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes('prof')) return Icons.people;
  if (normalized.includes('classe')) return Icons.school;
  if (normalized.includes('exam')) return Icons.doc;
  if (normalized.includes('cop')) return Icons.copy;
  if (normalized.includes('actif')) return Icons.check;
  if (normalized.includes('suspend')) return Icons.shield;
  if (normalized.includes('etud')) return Icons.people;

  return Icons.chart;
}

const tabIcons: Partial<Record<TabId, IconName>> = {
  home: Icons.home,
  establishments: Icons.business,
  professors: Icons.people,
  classes: Icons.school,
  exams: Icons.doc,
  students: Icons.people,
  stats: Icons.chart,
  report: Icons.report,
  profile: Icons.profile,
};

function getTabIcon(item: NavItem) {
  return tabIcons[item.id] ?? Icons.home;
}

export function Icon({
  name,
  color = colors.ink,
  size = 18,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Ionicons name={name} color={color} size={size} />;
}

type ScreenFrameProps = {
  title?: string;
  greeting?: string;
  children: ReactNode;
  tabs?: NavItem[];
  activeTab?: NavItem['id'];
  onTabPress?: (item: NavItem) => void;
  onBack?: () => void;
  rightAction?: {
    icon: IconName;
    onPress: () => void;
  };
  secondaryRightAction?: {
    icon: IconName;
    onPress: () => void;
  };
  compactHeader?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
};

export function ScreenFrame({
  title,
  greeting,
  children,
  tabs,
  activeTab,
  onTabPress,
  onBack,
  rightAction,
  secondaryRightAction,
  compactHeader,
  contentStyle,
  scrollable = true,
}: ScreenFrameProps) {
  const insets = useSafeAreaInsets();
  const hasTabs = Boolean(tabs?.length && activeTab && onTabPress);
  const headerHeight = compactHeader ? 72 : 100;
  const contentContainerStyle = [
    styles.content,
    hasTabs && { paddingBottom: 96 + insets.bottom },
    contentStyle,
  ];

  return (
    <View style={styles.viewport}>
      <StatusBar style="dark" />
      <View style={styles.phone}>
        <View
          style={[
            styles.header,
            {
              height: headerHeight + insets.top,
              paddingTop: insets.top + spacing.sm,
            },
          ]}>
          <View style={styles.headerRow}>
            {onBack ? (
              <HeaderIconButton icon={Icons.back} onPress={onBack} />
            ) : (
              <View style={styles.headerButtonPlaceholder} />
            )}
            <Text
              style={[
                styles.headerTitle,
                !onBack && styles.headerTitleWide,
                compactHeader && styles.headerTitleCompact,
              ]}>
              {greeting ?? title}
            </Text>
            {rightAction ? (
              <HeaderIconButton icon={rightAction.icon} onPress={rightAction.onPress} />
            ) : (
              <View style={styles.headerButtonPlaceholder} />
            )}
            {secondaryRightAction ? (
              <HeaderIconButton icon={secondaryRightAction.icon} onPress={secondaryRightAction.onPress} />
            ) : null}
          </View>
        </View>

        {scrollable ? (
          <ScrollView
            style={styles.panel}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}>
            {title && greeting ? <Text style={styles.panelTitle}>{title}</Text> : null}
            {children}
          </ScrollView>
        ) : (
          <View style={styles.panel}>
            <View
              style={[
                styles.content,
                hasTabs && { paddingBottom: 106 + insets.bottom },
                contentStyle,
                { flex: 1 },
              ]}>
              {title && greeting ? <Text style={styles.panelTitle}>{title}</Text> : null}
              {children}
            </View>
          </View>
        )}

        {hasTabs && tabs && activeTab && onTabPress ? (
          <BottomNav
            activeTab={activeTab}
            bottomInset={insets.bottom}
            items={tabs}
            onPress={onTabPress}
          />
        ) : null}
      </View>
    </View>
  );
}

export function AuthFrame({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.viewport}>
      <StatusBar style="dark" />
      <View style={styles.phoneWhite}>
        <View style={[styles.authTopBar, { height: insets.top + 82 }]} />
        <View style={styles.authContent}>{children}</View>
      </View>
    </View>
  );
}

function HeaderIconButton({ icon, onPress }: { icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
      <Icon name={icon} color={colors.card} size={18} />
    </Pressable>
  );
}

function BottomNav({
  activeTab,
  bottomInset,
  items,
  onPress,
}: {
  activeTab: NavItem['id'];
  bottomInset: number;
  items: NavItem[];
  onPress: (item: NavItem) => void;
}) {
  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(bottomInset, spacing.md) }]}>
      {items.map((item) => {
        const active = activeTab === item.id;
        const icon = getTabIcon(item);
        return (
          <Pressable
            accessibilityRole="tab"
            key={item.id}
            onPress={() => onPress(item)}
            style={({ pressed }) => [styles.bottomNavItem, pressed && styles.pressed]}>
            <View style={[styles.bottomNavIconWrap, active && styles.bottomNavIconWrapActive]}>
              <Icon name={icon} color={active ? colors.primary : colors.muted} size={18} />
            </View>
            <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BrandTitle({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.brandBlock}>
      <Text style={styles.brandTitle}>CorrectAI</Text>
      <Text style={styles.brandSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function RoleSwitch({
  selectedRole,
  onChange,
}: {
  selectedRole: UserRole;
  onChange: (role: UserRole) => void;
}) {
  const roles: Array<{ id: UserRole; label: string }> = [
    { id: 'super_admin', label: 'Super Admin' },
    { id: 'admin', label: 'Admin' },
    { id: 'professor', label: 'Prof' },
    { id: 'student', label: 'Etudiant' },
  ];

  return (
    <View style={styles.roleSwitch}>
      {roles.map((role) => {
        const active = selectedRole === role.id;
        return (
          <Pressable
            accessibilityRole="button"
            key={role.id}
            onPress={() => onChange(role.id)}
            style={[styles.roleOption, active && styles.roleOptionActive]}>
            <Text style={[styles.roleText, active && styles.roleTextActive]}>{role.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Card({
  children,
  icon,
  title,
  subtitle,
  style,
  headerStyle,
}: {
  children?: ReactNode;
  icon?: IconName;
  title?: ReactNode;
  subtitle?: ReactNode;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
}) {
  const hasHeader = Boolean(icon || title || subtitle);

  return (
    <View style={[styles.card, style]}>
      {hasHeader ? (
        <View style={[styles.cardHeader, headerStyle]}>
          {icon ? (
            <View style={styles.cardIconWrap}>
              <Icon name={icon} color={colors.primary} size={18} />
            </View>
          ) : null}
          <View style={styles.cardHeaderText}>
            {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.statGrid}>
      {items.map((item) => (
        <StatCard item={item} key={item.label} />
      ))}
    </View>
  );
}

function StatCard({ item }: { item: StatItem }) {
  const tone = toneColors(item.tone ?? 'primary');
  const icon = statIcon(item.label);

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: tone.background }]}>
        <Icon name={icon} color={tone.text} size={16} />
      </View>
      <Text style={[styles.statValue, { color: tone.text }]}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </View>
  );
}

export function ActionGrid({
  actions,
}: {
  actions: Array<{ label: string; icon?: IconName; onPress: () => void }>;
}) {
  return (
    <View style={styles.actionGrid}>
      {actions.map((action) => (
        <Pressable
          accessibilityRole="button"
          key={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
          {action.icon ? <Icon name={action.icon} color={colors.primary} size={18} /> : null}
          <Text style={styles.quickActionText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function PrimaryButton({
  children,
  icon,
  onPress,
  tone = 'primary',
  variant = 'solid',
  style,
}: {
  children: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  tone?: Tone;
  variant?: 'solid' | 'outline' | 'soft';
  style?: StyleProp<ViewStyle>;
}) {
  const toneSet = toneColors(tone);
  const isSolid = variant === 'solid';
  const backgroundColor = isSolid ? toneSet.text : variant === 'soft' ? toneSet.background : 'transparent';
  const borderColor = variant === 'outline' ? toneSet.text : backgroundColor;
  const textColor = isSolid ? colors.card : toneSet.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? <Icon name={icon} color={textColor} size={18} /> : null}
      <Text style={[styles.primaryButtonText, { color: textColor }]}>{children}</Text>
    </Pressable>
  );
}

export function TextButton({
  children,
  icon,
  onPress,
  tone = 'primary',
  style,
}: {
  children: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const toneSet = toneColors(tone);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, pressed && styles.pressed, style]}>
      {icon ? <Icon name={icon} color={toneSet.text} size={16} /> : null}
      <Text style={[styles.textButtonLabel, { color: toneSet.text }]}>{children}</Text>
    </Pressable>
  );
}

export function FloatingButton({
  children,
  icon = Icons.addCircle,
  onPress,
  style,
}: {
  children: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PrimaryButton icon={icon} onPress={onPress} style={[styles.floatingButton, style]}>
      {children}
    </PrimaryButton>
  );
}

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, style]}
        selectionColor={colors.primary}
        {...props}
      />
    </View>
  );
}

export function SearchRow({
  placeholder,
  sortLabel,
  value,
  onChangeText,
  onClear,
  onSortPress,
}: {
  placeholder: string;
  sortLabel?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  onSortPress?: () => void;
}) {
  return (
    <View style={styles.searchRow}>
      {sortLabel ? (
        onSortPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSortPress}
            style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}>
            <Icon name={Icons.sort} color={colors.muted} size={14} />
            <Text style={styles.sortText}>{sortLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.sortButton}>
            <Icon name={Icons.sort} color={colors.muted} size={14} />
            <Text style={styles.sortText}>{sortLabel}</Text>
          </View>
        )
      ) : null}
      <View style={styles.searchBox}>
        <Icon name={Icons.search} color={colors.primary} size={16} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          selectionColor={colors.primary}
          value={value}
          onChangeText={onChangeText}
          style={styles.searchInput}
        />
        {value && value.length > 0 && onClear ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClear}
            style={({ pressed }) => [styles.searchClearButton, pressed && styles.pressed]}>
            <Icon name={Icons.close} color={colors.muted} size={15} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function FilterChips({
  active,
  options,
  onChange,
}: {
  active: string;
  options: SelectOption[];
  onChange: (option: string) => void;
}) {
  return (
    <View style={styles.filterRow}>
      {options.map((option) => {
        const selected = option.id === active;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.filterChip, selected && styles.filterChipActive]}>
            <Text style={[styles.filterText, selected && styles.filterTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SegmentedControl({
  active,
  options,
  onChange,
}: {
  active: string;
  options: SelectOption[];
  onChange: (option: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = active === option.id;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.id}
            onPress={() => onChange(option.id)}
            style={styles.segmentButton}>
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{option.label}</Text>
            {selected ? <View style={styles.segmentLine} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatusPill({ label, tone }: { label: string; tone?: Tone }) {
  const toneSet = toneColors(tone);

  return (
    <View style={[styles.statusPill, { backgroundColor: toneSet.background }]}>
      <Text style={[styles.statusPillText, { color: toneSet.text }]}>{label}</Text>
    </View>
  );
}

export function Avatar({
  initials,
  tone = 'primary',
  size = 48,
}: {
  initials: string;
  tone?: Tone | 'orange';
  size?: number;
}) {
  const toneSet =
    tone === 'orange'
      ? { background: colors.orangeAvatar, text: '#9B4B0B' }
      : toneColors(tone as Tone);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: toneSet.background }]}>
      <Text style={[styles.avatarText, { color: toneSet.text }]}>{initials}</Text>
    </View>
  );
}

export function PersonRow({
  initials,
  title,
  subtitle,
  status,
  statusTone,
  avatarTone,
  onPress,
}: {
  initials: string;
  title: string;
  subtitle: string;
  status?: string;
  statusTone?: Tone;
  avatarTone?: Tone | 'orange';
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}>
      <Avatar initials={initials} tone={avatarTone} />
      <View style={styles.personMeta}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {status ? <StatusPill label={status} tone={statusTone} /> : null}
    </Pressable>
  );
}

export function ExamRow({
  title,
  subtitle,
  copies,
  date,
  status,
  statusTone,
  onPress,
}: {
  title: string;
  subtitle: string;
  copies?: string;
  date: string;
  status?: string;
  statusTone?: Tone;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.examRow, pressed && styles.pressed]}>
      <View style={styles.examIcon}>
        <Icon name={Icons.doc} color={colors.primary} size={18} />
      </View>
      <View style={styles.examMain}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.examSide}>
        {status ? <StatusPill label={status} tone={statusTone} /> : null}
        {copies ? (
          <View style={styles.miniMeta}>
            <Icon name={Icons.copy} color={colors.muted} size={12} />
            <Text style={styles.miniMetaText}>{copies}</Text>
          </View>
        ) : null}
        <View style={styles.miniMeta}>
          <Icon name={Icons.calendar} color={colors.muted} size={12} />
          <Text style={styles.miniMetaText}>{date}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function InfoRow({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: Tone;
  icon?: IconName;
}) {
  const toneSet = toneColors(tone ?? 'neutral');

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueGroup}>
        {icon ? <Icon name={icon} color={toneSet.text} size={15} /> : null}
        <Text style={[styles.infoValue, tone && { color: toneSet.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export function EmptyGap({ size = spacing.lg }: { size?: number }) {
  return <View style={{ height: size }} />;
}

export function ScoreHero({
  score,
  label,
  subtitle,
}: {
  score: string;
  label: string;
  subtitle?: string;
}) {
  return (
    <Card icon={Icons.trophy} style={styles.scoreCard} title="Moyenne generale">
      <Text style={styles.scoreValue}>{score}</Text>
      <StatusPill label={label} tone="success" />
      {subtitle ? <Text style={styles.scoreSubtitle}>{subtitle}</Text> : null}
    </Card>
  );
}

export function QuestionRow({
  question,
  selected = 'B',
  points = '1pt',
  onPress,
}: {
  question: number;
  selected?: string;
  points?: string;
  onPress?: () => void;
}) {
  const answers = ['A', 'B', 'C', 'D', 'E'];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.questionRow, pressed && styles.pressed]}>
      <View style={styles.questionNumber}>
        <Text style={styles.questionNumberText}>{question}</Text>
      </View>
      <View style={styles.answerGroup}>
        {answers.map((answer) => {
          const active = answer === selected;
          return (
            <View key={answer} style={[styles.answerChoice, active && styles.answerChoiceActive]}>
              <Text style={[styles.answerText, active && styles.answerTextActive]}>{answer}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.pointsText}>{points}</Text>
      <Icon name={Icons.info} color={colors.muted} size={15} />
    </Pressable>
  );
}

export function FormActions({
  onCancel,
  onSubmit,
  submitLabel = 'Enregistrer',
  cancelIcon = Icons.close,
  submitIcon = Icons.save,
}: {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelIcon?: IconName;
  submitIcon?: IconName;
}) {
  return (
    <View style={styles.formActions}>
      <TextButton icon={cancelIcon} onPress={onCancel} tone="neutral">
        Annuler
      </TextButton>
      <PrimaryButton icon={submitIcon} onPress={onSubmit}>
        {submitLabel}
      </PrimaryButton>
    </View>
  );
}

const shadow = {
  shadowColor: '#1F2440',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    backgroundColor: '#DDE1EA',
    alignItems: 'center',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: phoneMaxWidth,
    backgroundColor: colors.screen,
    overflow: 'hidden',
  },
  phoneWhite: {
    flex: 1,
    width: '100%',
    maxWidth: phoneMaxWidth,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  headerRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    color: colors.card,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  headerTitleWide: {
    marginLeft: -42,
  },
  headerTitleCompact: {
    fontSize: 19,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  panel: {
    flex: 1,
    marginTop: -14,
    backgroundColor: colors.screen,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 84,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow,
  },
  bottomNavItem: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.sm,
    marginHorizontal: 2,
  },
  bottomNavIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  bottomNavIconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
  bottomNavText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
  },
  bottomNavTextActive: {
    color: colors.primary,
  },
  authTopBar: {
    backgroundColor: colors.primary,
  },
  authContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: spacing.md,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandTitle: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '600',
  },
  brandSubtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.screen,
    borderRadius: radius.sm,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  roleOption: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
  },
  roleOptionActive: {
    backgroundColor: colors.card,
    ...shadow,
  },
  roleText: {
    color: colors.muted,
    fontWeight: '700',
  },
  roleTextActive: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.72,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 68,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 21,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A8E99',
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAction: {
    width: '48.4%',
    minHeight: 50,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  quickActionText: {
    color: '#96979E',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  textButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  textButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  floatingButton: {
    alignSelf: 'flex-end',
    borderRadius: 24,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#D7D9E0',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: colors.card,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sortButton: {
    minWidth: 108,
    height: 48,
    borderRadius: radius.xs,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sortText: {
    color: colors.ink,
    fontWeight: '700',
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: radius.xs,
    borderWidth: 1.2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  searchClearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.screen,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  filterChip: {
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.card,
  },
  filterText: {
    color: colors.ink,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.primary,
  },
  segmented: {
    flexDirection: 'row',
    minHeight: 54,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  segmentText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  segmentLine: {
    height: 1.5,
    width: '76%',
    backgroundColor: colors.primary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    minHeight: 22,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  personRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personMeta: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  examRow: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: '#D8D1D1',
    minHeight: 82,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  examIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examMain: {
    flex: 1,
    gap: spacing.xxs,
  },
  examSide: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    maxWidth: 138,
  },
  miniMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  miniMetaText: {
    color: colors.muted,
    fontSize: 11,
  },
  infoRow: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  infoValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  infoValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  scoreCard: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  scoreSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  questionRow: {
    minHeight: 58,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    ...shadow,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    color: colors.card,
    fontWeight: '800',
  },
  answerGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  answerChoice: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.screen,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerChoiceActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  answerText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12,
  },
  answerTextActive: {
    color: colors.card,
  },
  pointsText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12,
    minWidth: 28,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
