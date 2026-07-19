import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field } from '../../components/ui';
import { QrImage } from '../manager/QrImage';
import { MyQr, getMyQrs, createMyQr, deleteMyQr, useResidentCondo } from './resident.api';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const linkFor = (t: string) => `${WEB_URL}/?t=${t}`;

/** Meus QR codes (②·9) — QRs de visita gerados pelo morador. */
export function MeusQrScreen() {
  const nav = useNavigation<any>();
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [rows, setRows] = useState<MyQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [validity, setValidity] = useState<'today' | 'fixed'>('today');
  const [usage, setUsage] = useState<'single' | 'unlimited'>('single');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try { setRows(await getMyQrs(id)); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    if (!id || label.trim().length < 2) return;
    setBusy(true);
    try {
      await createMyQr(id, { label: label.trim(), validity_mode: validity, usage_mode: usage });
      setLabel('');
      await load();
    } catch (e: any) { Alert.alert('Erro', e.message ?? 'Falha ao gerar.'); } finally { setBusy(false); }
  };
  const remove = (q: MyQr) =>
    Alert.alert('Excluir QR', `Excluir "${q.label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { if (id) { await deleteMyQr(id, q.id); load(); } } },
    ]);

  const ativos = rows.filter((r) => !r.expired);
  const expirados = rows.filter((r) => r.expired);

  const card = (q: MyQr) => (
    <View key={q.id} style={[styles.card, q.expired && styles.cardOff]}>
      <QrImage value={linkFor(q.token)} size={64} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{q.label}</Text>
        <Text style={styles.meta}>{q.validity_mode === 'today' ? 'Válido hoje' : 'Sem expiração'} · {q.usage_mode === 'single' ? 'Uso único' : 'Ilimitado'} · {q.used_count} usos</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => Share.share({ message: `Acesso ao ${condo?.condoName}: ${linkFor(q.token)}` })}><Text style={styles.share}>Compartilhar</Text></Pressable>
          <Pressable onPress={() => remove(q)}><Text style={styles.del}>Excluir</Text></Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => nav.goBack()} hitSlop={12}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Meus QR codes</Text>
        <Text style={styles.sub}>Gere um QR para uma visita ou entregador chamar sua unidade.</Text>

        <View style={styles.form}>
          <Field label="Para quem? (nome do visitante)" value={label} onChangeText={setLabel} placeholder="Ex.: Visita João" />
          <Text style={styles.flabel}>Validade</Text>
          <View style={styles.chips}>
            <Chip label="Hoje" on={validity === 'today'} onPress={() => setValidity('today')} />
            <Chip label="Sem expiração" on={validity === 'fixed'} onPress={() => setValidity('fixed')} />
          </View>
          <Text style={styles.flabel}>Uso</Text>
          <View style={styles.chips}>
            <Chip label="Único" on={usage === 'single'} onPress={() => setUsage('single')} />
            <Chip label="Ilimitado" on={usage === 'unlimited'} onPress={() => setUsage('unlimited')} />
          </View>
          <View style={{ height: spacing.md }} />
          <PrimaryButton label={busy ? 'Gerando…' : '+ Gerar novo QR code'} onPress={create} loading={busy} disabled={label.trim().length < 2} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
        ) : (
          <>
            {ativos.length > 0 && <Text style={styles.section}>Ativos</Text>}
            {ativos.map(card)}
            {expirados.length > 0 && <Text style={styles.section}>Expirados</Text>}
            {expirados.map(card)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.md },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  form: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl },
  flabel: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: typography.weight.medium },
  chips: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: typography.size.sm },
  chipTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  section: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.semibold, marginBottom: spacing.md, marginTop: spacing.sm },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  cardOff: { opacity: 0.55 },
  label: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  share: { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  del: { color: colors.error, fontSize: typography.size.sm },
});
