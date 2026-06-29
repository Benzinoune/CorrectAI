import { useState } from 'react';
import { Text, View } from 'react-native';

import { Card, Field, Icons, InfoRow, PrimaryButton, ScreenFrame, SectionTitle } from '@/features/correctai/components/ui';
import { studentTabs } from '@/features/correctai/data/mock-data';
import { StudentScreenProps, styles, tabPress } from './shared';

export function StudentProfileScreen({ activeTab, onNavigate, studentsData, selectedStudent, onUpdateStudent }: StudentScreenProps) {
  const student = selectedStudent ?? studentsData[0];
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdatePassword = () => {
    setPasswordError('');
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError('Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (oldPassword !== 'password123') {
      setPasswordError('Ancien mot de passe incorrect.');
      return;
    }
    onUpdateStudent?.({ ...student, password: newPassword });
    setSaved(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const initials = student.initials ?? (student.firstName?.[0] ?? '') + (student.lastName?.[0] ?? '');
  const fullName = student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.initials ?? 'Etudiant';

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Profil"
      onTabPress={tabPress(onNavigate)}
      tabs={studentTabs}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials || 'AB'}</Text>
        </View>
        <Text style={styles.profileName}>{fullName}</Text>
        <Text style={styles.rowSubtitle}>{student.matricule ?? 'MAT-2024-001'}</Text>
      </View>
      <SectionTitle>Changer mot de passe</SectionTitle>
      <Field placeholder="Ancien mot de passe" onChangeText={setOldPassword} secureTextEntry value={oldPassword} />
      <Field placeholder="Nouveau" onChangeText={setNewPassword} secureTextEntry value={newPassword} />
      <Field placeholder="Confirmer" onChangeText={setConfirmPassword} secureTextEntry value={confirmPassword} />
      {passwordError ? <Text style={styles.passwordError}>{passwordError}</Text> : null}
      <PrimaryButton icon={Icons.save} onPress={handleUpdatePassword}>
        {saved ? 'Mis a jour' : 'Mettre a jour'}
      </PrimaryButton>
      {saved ? <Text style={styles.confirmation}>Mot de passe mis a jour.</Text> : null}
      <SectionTitle>Parametres</SectionTitle>
      <Card icon={Icons.gear} style={styles.settingsCard} title="Compte">
        <InfoRow icon={Icons.notifications} label="Notifications" value="Activees" />
        <InfoRow icon={Icons.shield} label="Securite" value="Mot de passe" />
        <InfoRow icon={Icons.book} label="Langue" value="Francais" />
      </Card>
    </ScreenFrame>
  );
}
