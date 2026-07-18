import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../theme';

/** Modal de input (substitui Alert.prompt, que não existe no Android). */
export function PromptModal({
  visible,
  title,
  placeholder,
  initial = '',
  confirmLabel = 'Salvar',
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => { if (visible) setValue(initial); }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <View style={styles.row}>
            <Pressable style={styles.cancel} onPress={onCancel}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
            <Pressable style={styles.confirm} onPress={() => value.trim() && onConfirm(value.trim())}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 400, backgroundColor: colors.card, borderRadius: radii.card, padding: spacing.xl },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  input: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radii.button, paddingHorizontal: spacing.md, fontSize: typography.size.md, color: colors.text, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.lg },
  cancel: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  cancelText: { color: colors.textSecondary, fontSize: typography.size.md },
  confirm: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, backgroundColor: colors.accent, borderRadius: radii.button },
  confirmText: { color: colors.textOnAccent, fontSize: typography.size.md, fontWeight: typography.weight.semibold },
});
