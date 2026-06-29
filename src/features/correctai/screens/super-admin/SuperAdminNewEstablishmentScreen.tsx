import { useState } from 'react';
import { Text, View } from 'react-native';

import { Field, FormActions, ScreenFrame } from '@/features/correctai/components/ui';
import { SuperAdminScreenProps, styles } from './shared';

export function SuperAdminNewEstablishmentScreen({ onNavigate, onCreateEstablishment }: SuperAdminScreenProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [adminFirst, setAdminFirst] = useState('');
  const [adminLast, setAdminLast] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push('Nom');
    if (!city.trim()) missing.push('Ville');
    if (!adminFirst.trim()) missing.push('Prenom admin');
    if (!adminLast.trim()) missing.push('Nom admin');
    if (!email.trim()) missing.push('Email');
    if (!password.trim()) missing.push('Mot de passe');
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    setErrors([]);
    onCreateEstablishment?.({
      name: name.trim(),
      city: city.trim(),
      adminName: `${adminFirst.trim()} ${adminLast.trim()}`,
      adminEmail: email.trim().toLowerCase(),
      adminPassword: password,
    });
    onNavigate('super-admin-establishments');
  };

  return (
    <ScreenFrame compactHeader onBack={() => onNavigate('super-admin-establishments')} title="Nouveau Etablissement">
      <View style={styles.form}>
        <Field autoCapitalize="words" label="Nom de l'etablissement *" onChangeText={setName} value={name} />
        <Field autoCapitalize="words" label="Ville *" onChangeText={setCity} value={city} />
        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Field autoCapitalize="words" label="Prenom de l'admin *" onChangeText={setAdminFirst} value={adminFirst} />
          </View>
          <View style={styles.fieldHalf}>
            <Field autoCapitalize="words" label="Nom de l'admin *" onChangeText={setAdminLast} value={adminLast} />
          </View>
        </View>
        <Field autoCapitalize="none" keyboardType="email-address" label="Email de l'admin *" onChangeText={setEmail} value={email} />
        <Field autoCapitalize="none" label="Mot de passe provisoire *" onChangeText={setPassword} secureTextEntry value={password} />
        <Text style={styles.formHint}>L'administrateur pourra changer son mot de passe par la suite.</Text>
        {errors.length > 0 && <Text style={styles.formError}>Veuillez remplir les champs: {errors.join(', ')}.</Text>}
        <FormActions onCancel={() => onNavigate('super-admin-establishments')} submitLabel="Creer l'etablissement" onSubmit={submit} />
      </View>
    </ScreenFrame>
  );
}
