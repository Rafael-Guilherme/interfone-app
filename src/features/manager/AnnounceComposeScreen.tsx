import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field } from '../../components/ui';
import { Announcement, BlockRow, createAnnouncement, getStructure, listAnnouncements, useManagerCondo } from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'Announce'>;

/** Enviar comunicado (④·5) — Todos ou por bloco + histórico. */
export function AnnounceComposeScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const id = condo?.condoId;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scope, setScope] = useState<'all' | 'block'>('all');
  const [blockId, setBlockId] = useState<string>('');
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [list, setList] = useState<Announcement[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = async () => { if (id) setList(await listAnnouncements(id)); };
  useEffect(() => {
    if (!id) return;
    getStructure(id).then((s) => setBlocks(s.blocks));
    reload();
  }, [id]);

  const send = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await createAnnouncement(id, { title, body, scope, block_id: scope === 'block' ? blockId : undefined });
      setTitle(''); setBody(''); setScope('all'); setBlockId('');
      await reload();
      Alert.alert('Enviado', 'Comunicado publicado para os moradores.');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao enviar.');
    } finally { setBusy(false); }
  };

  const valid = title.trim() && body.trim() && (scope === 'all' || blockId);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Enviar comunicado</Text>

        <Field label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Manutenção da caixa d'água" />
        <Field label="Mensagem" value={body} onChangeText={setBody} placeholder="Escreva o comunicado…" multiline />

        <Text style={styles.label}>Destinatários</Text>
        <View style={styles.seg}>
          <Pressable style={[styles.segBtn, scope === 'all' && styles.segOn]} onPress={() => setScope('all')}><Text style={[styles.segText, scope === 'all' && styles.segTextOn]}>Todos</Text></Pressable>
          <Pressable style={[styles.segBtn, scope === 'block' && styles.segOn]} onPress={() => setScope('block')} disabled={blocks.length === 0}>
            <Text style={[styles.segText, scope === 'block' && styles.segTextOn, blocks.length === 0 && { color: colors.textMuted }]}>Por bloco</Text>
          </Pressable>
        </View>
        {scope === 'block' && (
          <View style={styles.chips}>
            {blocks.map((b) => (
              <Pressable key={b.id} onPress={() => setBlockId(b.id)} style={[styles.chip, blockId === b.id && styles.chipOn]}>
                <Text style={[styles.chipText, blockId === b.id && styles.chipTextOn]}>Bloco {b.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: spacing.md }} />
        <PrimaryButton label={busy ? 'Enviando…' : 'Enviar comunicado'} onPress={send} loading={busy} disabled={!valid} />

        {list.length > 0 && (
          <>
            <Text style={styles.histLabel}>Enviados</Text>
            {list.map((a) => (
              <View key={a.id} style={styles.hist}>
                <Text style={styles.histTitle}>{a.title}</Text>
                <Text style={styles.histBody} numberOfLines={2}>{a.body}</Text>
                <Text style={styles.histMeta}>{a.scope === 'block' && a.block ? `Bloco ${a.block}` : 'Todos'} · {a.reads} leram</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.md },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: typography.weight.medium },
  seg: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  segBtn: { flex: 1, height: 44, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  segOn: { backgroundColor: colors.text, borderColor: colors.text },
  segText: { color: colors.text, fontSize: typography.size.sm },
  segTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: typography.size.sm },
  chipTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  histLabel: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.semibold, marginTop: spacing.xxl, marginBottom: spacing.md },
  hist: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  histTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  histBody: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  histMeta: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.sm },
});
