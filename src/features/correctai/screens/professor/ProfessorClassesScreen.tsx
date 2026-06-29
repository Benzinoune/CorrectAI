import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, FloatingButton, Icon, Icons, ScreenFrame, SearchRow } from '@/features/correctai/components/ui';
import { classes, professorTabs } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { ClassRoom } from '@/features/correctai/types';
import { normalizeSearch, tabPress, type ProfessorScreenProps } from './shared';

const { colors, spacing, radius } = correctAiTheme;

function ProfessorClassCard({
  item,
  onPress,
}: {
  item: ClassRoom;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.classCardPressable, pressed && styles.pressed]}>
      <View style={styles.classCard}>
        <View style={styles.classCardHeader}>
          <View style={styles.classIconWrap}>
            <Icon name={Icons.school} color={colors.primary} size={18} />
          </View>
          <View style={styles.classHeaderText}>
            <Text numberOfLines={1} style={styles.classTitle}>
              {item.name}
            </Text>
            <Text numberOfLines={1} style={styles.classSubtitle}>
              {item.students} etudiants - {item.exams} examens
            </Text>
          </View>
          <Icon name={Icons.chevron} color={colors.faint} size={18} />
        </View>

        <View style={styles.classMetaRow}>
          <View style={styles.classMetaPill}>
            <Icon name={Icons.doc} color={colors.primary} size={13} />
            <Text style={styles.classMetaText}>{item.exams} examens</Text>
          </View>
          <View style={styles.classMetaPill}>
            <Icon name={Icons.people} color={colors.primary} size={13} />
            <Text style={styles.classMetaText}>{item.students} etudiants</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CreateClassModal({
  visible,
  onCancel,
  onSave,
}: {
  visible: boolean;
  onCancel: () => void;
  onSave: (nextName: string) => void;
}) {
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftName('');
    setNameError('');
    opacity.setValue(0);
    scale.setValue(0.96);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  if (!visible) {
    return null;
  }

  const handleSave = () => {
    const nextName = draftName.trim();
    if (!nextName) {
      setNameError('Le nom de la classe est requis.');
      return;
    }
    setNameError('');
    onSave(nextName);
  };

  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.classModalRoot}>
        <View style={styles.classModalLayer}>
          <Pressable onPress={onCancel} style={styles.classModalBackdrop} />
          <Animated.View style={[styles.classModalCard, { opacity, transform: [{ scale }] }]}>
            <Text style={styles.classModalTitle}>Nouvelle classe</Text>

            <View style={styles.classModalFieldGroup}>
              <Text style={styles.classModalLabel}>Nom de la classe *</Text>
              <View style={styles.classModalInputShell}>
                <Icon name={Icons.school} color={colors.primary} size={16} />
                <TextInput
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  autoFocus
                  placeholder="Nom de la classe"
                  placeholderTextColor={colors.faint}
                  returnKeyType="done"
                  selectionColor={colors.primary}
                  style={styles.classModalInput}
                  value={draftName}
                  onChangeText={(text) => { setDraftName(text); if (nameError) setNameError(''); }}
                  onSubmitEditing={handleSave}
                />
              </View>
              {nameError ? <Text style={styles.classModalError}>{nameError}</Text> : null}
            </View>

            <View style={styles.classModalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={({ pressed }) => [styles.classModalAction, styles.classModalNeutralAction, pressed && styles.pressed]}>
                <Text style={styles.classModalNeutralText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleSave}
                style={({ pressed }) => [styles.classModalAction, styles.classModalPrimaryAction, pressed && styles.pressed]}>
                <Text style={styles.classModalPrimaryText}>Enregistrer</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ProfessorClassesScreen({
  activeTab,
  onNavigate,
  onSelectClass,
  onCreateClass,
  classesData,
}: ProfessorScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const classList = classesData ?? classes;

  const visibleClasses = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());

    if (!normalizedQuery) {
      return classList;
    }

    return classList.filter((item) => {
      const haystack = normalizeSearch(`${item.name} ${item.students} ${item.exams}`);
      return haystack.includes(normalizedQuery);
    });
  }, [classList, query]);

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Classes"
      onTabPress={tabPress(onNavigate)}
      scrollable={false}
      tabs={professorTabs}>
      <View style={styles.classesPage}>
        <View style={styles.classesToolbar}>
          <SearchRow
            placeholder="Rechercher une classe..."
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
          />
        </View>

        <FlatList
          data={visibleClasses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProfessorClassCard
              item={item}
              onPress={() => {
                onSelectClass?.(item);
                onNavigate('professor-class-detail');
              }}
            />
          )}
          style={styles.classesList}
          contentContainerStyle={[
            styles.classesListContent,
            { paddingBottom: 120 + Math.max(insets.bottom, spacing.sm) },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card icon={Icons.search} style={styles.classesEmptyCard} title="Aucune classe trouvee">
              <Text style={styles.classesEmptyText}>
                Essayez un autre nom ou effacez la recherche pour voir toutes les classes.
              </Text>
            </Card>
          }
        />

        <View
          pointerEvents="box-none"
          style={[
            styles.classesFabOverlay,
            {
              paddingBottom: 84 + Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <FloatingButton onPress={() => setIsCreateOpen(true)} style={styles.fabButton}>
            Nouvelle classe
          </FloatingButton>
        </View>
      </View>

      <CreateClassModal
        visible={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onSave={(nextName) => {
          setQuery('');
          onCreateClass?.(nextName);
          setIsCreateOpen(false);
        }}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  classesPage: {
    flex: 1,
    position: 'relative',
  },
  classesToolbar: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  classesList: {
    flex: 1,
    minHeight: 0,
  },
  classesListContent: {
    gap: spacing.md,
  },
  classesEmptyCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  classesEmptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  classCardPressable: {
    borderRadius: radius.lg,
  },
  classCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#1F2440',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  classIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classHeaderText: {
    flex: 1,
    gap: 2,
  },
  classTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  classSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  classMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  classMetaPill: {
    minHeight: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  classMetaText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  classesFabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 20,
    elevation: 20,
    paddingHorizontal: spacing.md,
  },
  fabButton: {
    marginTop: 0,
  },
  pressed: {
    opacity: 0.72,
  },
  classModalRoot: {
    flex: 1,
  },
  classModalLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  classModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 22, 38, 0.52)',
  },
  classModalCard: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingTop: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#1F2440',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  classModalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  classModalFieldGroup: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  classModalLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  classModalInputShell: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
  },
  classModalInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 0,
  },
  classModalError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  classModalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 56,
  },
  classModalAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  classModalNeutralAction: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  classModalPrimaryAction: {},
  classModalNeutralText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  classModalPrimaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
