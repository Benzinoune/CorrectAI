import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Avatar,
  Card,
  EmptyGap,
  Field,
  Icon,
  Icons,
  InfoRow,
  PrimaryButton,
  ScreenFrame,
  SectionTitle,
  StatGrid,
  TextButton,
} from '@/features/correctai/components/ui';
import { classes, exams, professorTabs, students } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import { ProfessorScreenProps, tabPress } from './shared';

const { colors, spacing, radius } = correctAiTheme;

const localStyles = StyleSheet.create({
  accountClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  accountClassIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountClassName: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  accountClassCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  accountClassDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  accountActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  accountActionText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  accountActionDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  modalError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  profileCard: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  profileStatus: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
});

export function ProfessorAccountScreen({
  activeTab,
  classesData,
  examsData,
  onLogin,
  onNavigate,
  onUpdateProfessor,
  professorsData,
  selectedProfessor,
  studentsData,
}: ProfessorScreenProps) {
  const professor = selectedProfessor;
  const examList = examsData ?? exams;
  const studentList = studentsData ?? students;
  const classList = classesData ?? classes;
  const professorClasses = useMemo(
    () => classList.filter((c) => c.establishmentId === professor?.establishmentId),
    [classList, professor],
  );
  const totalCopies = examList.reduce((sum, e) => sum + (e.scannedCopies?.length ?? e.copies), 0);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editName, setEditName] = useState(professor?.name ?? '');
  const [editEmail, setEditEmail] = useState(professor?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (professor) {
      setEditName(professor.name);
      setEditEmail(professor.email);
    }
  }, [professor]);

  const handleSaveProfile = () => {
    if (!professor || !onUpdateProfessor) return;
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();
    if (!trimmedName) { setEditError('Le nom est requis.'); return; }
    if (!trimmedEmail || !trimmedEmail.includes('@')) { setEditError('Email invalide.'); return; }
    setEditError('');
    onUpdateProfessor({
      ...professor,
      name: trimmedName,
      email: trimmedEmail,
      initials: trimmedName.split(' ').map((p) => p.charAt(0)).join('').toUpperCase().slice(0, 2) || professor.initials,
    });
    setEditModalVisible(false);
  };

  const handleChangePassword = () => {
    if (!professor || !onUpdateProfessor) return;
    if (!currentPassword) { setPasswordError('Mot de passe actuel requis.'); return; }
    if (currentPassword !== professor.password) { setPasswordError('Mot de passe actuel incorrect.'); return; }
    if (!newPassword || newPassword.length < 6) { setPasswordError('Nouveau mot de passe (min 6 caracteres).'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas.'); return; }
    setPasswordError('');
    onUpdateProfessor({ ...professor, password: newPassword });
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Voulez-vous vraiment vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se deconnecter', style: 'destructive', onPress: () => onLogin?.('professor') },
      ],
    );
  };

  return (
    <ScreenFrame activeTab={activeTab} greeting="Mon Compte" onTabPress={tabPress(onNavigate)} tabs={professorTabs}>
      <Card style={localStyles.profileCard}>
        <View style={localStyles.profileHeader}>
          <Avatar initials={professor?.initials ?? 'PR'} size={64} tone={professor?.status === 'SUSPENDU' ? 'danger' : 'primary'} />
          <View style={localStyles.profileMeta}>
            <Text style={localStyles.profileName}>{professor?.name ?? 'Professeur'}</Text>
            <Text style={localStyles.profileStatus}>{professor?.status ?? 'ACTIF'}</Text>
          </View>
        </View>
        <InfoRow icon={Icons.mail} label="Email" value={professor?.email ?? '-'} />
        <InfoRow icon={Icons.business} label="Etablissement" value={professor?.establishment ?? '-'} />
        <InfoRow icon={Icons.school} label="Classes" value={String(professorClasses.length)} />
      </Card>

      <SectionTitle>Statistiques</SectionTitle>
      <StatGrid
        items={[
          { label: 'Classes', value: String(professorClasses.length), tone: 'primary' },
          { label: 'Examens', value: String(examList.length), tone: 'primary' },
          { label: 'Etudiants', value: String(studentList.length), tone: 'primary' },
          { label: 'Copies', value: String(totalCopies), tone: 'info' },
        ]}
      />

      {professorClasses.length > 0 && (
        <>
          <SectionTitle>Mes Classes ({professorClasses.length})</SectionTitle>
          <Card>
            {professorClasses.map((c, i) => (
              <View key={c.id}>
                <Pressable
                  onPress={() => { onNavigate('professor-classes'); }}
                  style={({ pressed }) => [localStyles.accountClassRow, pressed && localStyles.pressed]}>
                  <View style={localStyles.accountClassIcon}>
                    <Icon name={Icons.school} color={colors.primary} size={16} />
                  </View>
                  <Text style={localStyles.accountClassName}>{c.name}</Text>
                  <Text style={localStyles.accountClassCount}>{c.students} etudiants</Text>
                </Pressable>
                {i < professorClasses.length - 1 && <View style={localStyles.accountClassDivider} />}
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Actions</SectionTitle>
      <Card>
        <Pressable
          onPress={() => { setEditModalVisible(true); }}
          style={({ pressed }) => [localStyles.accountActionRow, pressed && localStyles.pressed]}>
          <Icon name={Icons.edit} color={colors.primary} size={18} />
          <Text style={localStyles.accountActionText}>Modifier le profil</Text>
          <Icon name={Icons.chevron} color={colors.faint} size={16} />
        </Pressable>
        <View style={localStyles.accountActionDivider} />
        <Pressable
          onPress={() => { setPasswordModalVisible(true); }}
          style={({ pressed }) => [localStyles.accountActionRow, pressed && localStyles.pressed]}>
          <Icon name={Icons.lock} color={colors.primary} size={18} />
          <Text style={localStyles.accountActionText}>Changer le mot de passe</Text>
          <Icon name={Icons.chevron} color={colors.faint} size={16} />
        </Pressable>
        <View style={localStyles.accountActionDivider} />
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [localStyles.accountActionRow, pressed && localStyles.pressed]}>
          <Icon name={Icons.close} color={colors.danger} size={18} />
          <Text style={[localStyles.accountActionText, { color: colors.danger }]}>Se deconnecter</Text>
        </Pressable>
      </Card>

      <EmptyGap />

      <Modal animationType="slide" transparent visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Modifier le profil</Text>
            {editError ? <Text style={localStyles.modalError}>{editError}</Text> : null}
            <Field label="Nom complet" value={editName} onChangeText={setEditName} autoCapitalize="words" />
            <Field label="Email" value={editEmail} onChangeText={setEditEmail} autoCapitalize="none" keyboardType="email-address" />
            <View style={localStyles.modalActions}>
              <TextButton onPress={() => { setEditModalVisible(false); setEditError(''); }} tone="neutral">Annuler</TextButton>
              <PrimaryButton onPress={handleSaveProfile}>Enregistrer</PrimaryButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={passwordModalVisible} onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Changer le mot de passe</Text>
            {passwordError ? <Text style={localStyles.modalError}>{passwordError}</Text> : null}
            <Field label="Mot de passe actuel" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <Field label="Nouveau mot de passe" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <Field label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <View style={localStyles.modalActions}>
              <TextButton onPress={() => { setPasswordModalVisible(false); setPasswordError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} tone="neutral">Annuler</TextButton>
              <PrimaryButton onPress={handleChangePassword}>Changer</PrimaryButton>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenFrame>
  );
}
