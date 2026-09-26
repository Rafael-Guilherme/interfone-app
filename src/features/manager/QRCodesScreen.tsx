import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../components/ui';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PromptModal } from './PromptModal';
import { QrImage } from './QrImage';
import { QrCodeRow, listQrs, createQr, updateQr, deleteQr, useManagerCondo } from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';
import { qrLink as linkFor } from '../../api/config';

type Props = NativeStackScreenProps<ManagerStackParamList, 'QRCodes'>;

/** QR codes do gestor (③·7) — criar, ativar/desativar, compartilhar, remover. */
export function QRCodesScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const id = condo?.condoId;
  const [rows, setRows] = useState<QrCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try { setRows(await listQrs(id)); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (q: QrCodeRow) => { if (id) { await updateQr(id, q.id, { active: !q.active }); load(); } };
  const share = (q: QrCodeRow) => Share.share({ message: linkFor(q.token) });
  const remove = (q: QrCodeRow) =>
    Alert.alert('Remover QR code', `Remover "${q.label ?? q.token}"? Quem tiver este QR perde o acesso.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { if (id) { await deleteQr(id, q.id); load(); } } },
    ]);

  if (!id) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>QR codes</Text>
        <Text style={styles.sub}>Crie e compartilhe QR/links da portaria. Entregadores e visitantes chamam por eles.</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            {rows.map((q) => (
              <View key={q.id} style={[styles.card, !q.active && styles.cardOff]}>
                <QrImage value={linkFor(q.token)} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{q.label ?? 'QR code'}</Text>
                  <Text style={styles.meta}>{q.unit ?? 'Condomínio todo'} · {q.used_count} usos</Text>
                  <Text style={styles.link} numberOfLines={1}>{linkFor(q.token)}</Text>
                  <View style={styles.actions}>
                    <Pressable onPress={() => share(q)}><Text style={styles.actShare}>Compartilhar</Text></Pressable>
                    <Pressable onPress={() => remove(q)}><Text style={styles.actDel}>Remover</Text></Pressable>
                  </View>
                </View>
                <Switch value={q.active} onValueChange={() => toggle(q)} trackColor={{ true: colors.accent }} />
              </View>
            ))}

            <Pressable style={styles.add} onPress={() => setAdding(true)}>
              <Text style={styles.addText}>＋ Novo QR code</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <PromptModal
        visible={adding}
        title="Novo QR code"
        placeholder="Nome (ex.: Portaria, Visitantes)"
        confirmLabel="Criar"
        onCancel={() => setAdding(false)}
        onConfirm={async (v) => { setAdding(false); if (id) { await createQr(id, v); load(); } }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl, lineHeight: 20 },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  cardOff: { opacity: 0.55 },
  qrGlyphBox: { width: 48, height: 48, borderRadius: radii.button, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qrGlyph: { fontSize: 28, color: colors.text },
  label: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2 },
  link: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  actShare: { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  actDel: { color: colors.error, fontSize: typography.size.sm },
  add: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginTop: spacing.sm },
  addText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
});
