import { Pressable, Text, View, type TextInputProps } from 'react-native';

import { Avatar, Field, Icon, Icons } from '@/features/correctai/components/ui';
import { correctAiTheme } from '@/features/correctai/theme';
import type { ClassRoom, Student } from '@/features/correctai/types';
import { studentClassLabels, studentDisplayName, styles } from './shared';

const { colors } = correctAiTheme;

export function StudentCard({
  item,
  classList,
  onPress,
}: {
  item: Student;
  classList: ClassRoom[];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.studentCardPressable, pressed && styles.pressed]}>
      <View style={styles.studentCard}>
        <View style={styles.studentCardHeader}>
          <Avatar initials={item.initials} size={48} />
          <View style={styles.studentHeaderText}>
            <Text numberOfLines={1} style={styles.studentName}>
              {studentDisplayName(item)}
            </Text>
            <Text numberOfLines={1} style={styles.studentSubtitle}>
              Matricule {item.matricule}
            </Text>
          </View>
          <Icon name={Icons.chevron} color={colors.faint} size={18} />
        </View>

        <View style={styles.studentMetaRow}>
          <View style={styles.studentMetaPill}>
            <Icon name={Icons.book} color={colors.primary} size={13} />
            <Text style={styles.studentMetaText}>{item.classes.length} classes</Text>
          </View>
          <View style={styles.studentMetaPill}>
            <Icon name={Icons.key} color={colors.primary} size={13} />
            <Text style={styles.studentMetaText}>ID {item.correctAiId}</Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.studentClasses}>
          {studentClassLabels(item, classList).join(', ')}
        </Text>
      </View>
    </Pressable>
  );
}

export function StudentFormField({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.studentFormFieldGroup}>
      <Field label={label} style={[styles.studentFormInput, error && styles.studentFormInputError, style]} {...props} />
      {error ? <Text style={styles.studentFormError}>{error}</Text> : null}
    </View>
  );
}
