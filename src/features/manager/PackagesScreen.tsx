import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../components/ui';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import {
  PackageRow,
  Structure,
  listPackages,
  createPackage,
  pickupPackage,
  deletePackage,
  getStructure,
  useManagerCondo,
} from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'Packages'>;

const quando = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Encomendas (③) — a portaria registra o que chegou e marca a retirada. */
export function PackagesScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const id = condo?.condoId;
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [estrutura, setEstrutura] = useState<Structure | null>(null);
  const [aba, setAba] = useState<'waiting' | 'picked_up'>('waiting');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ unit_id: string; description: string; recipient: string; carrier: string } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [p, s] = await Promise.all([listPackages(id, aba), getStructure(id)]);
      setRows(p);
      setEstrutura(s);
    } finally {
      setLoading(false);
    }
  }, [id, aba]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  /** Achata blocos + unidades soltas numa lista só, para o seletor do formulário. */
  const unidades = useMemo(() => {
    if (!estrutura) return [];
    const deBlocos = estrutura.blocks.flatMap((b) =>
      b.units.map((u) => ({ id: u.id, label: `Bloco ${b.name} · ${u.number}` })),
    );
    return [...deBlocos, ...estrutura.units_no_block.map((u) => ({ id: u.id, label: u.number }))];
  }, [estrutura]);

  async function registrar() {
    if (!id || !form?.unit_id || !form.description.trim()) return;
    await createPackage(id, {
      unit_id: form.unit_id,
      description: form.description.trim(),
      recipient: form.recipient.trim() || undefined,
      carrier: form.carrier.trim() || undefined,
    });
    setForm(null);
    setAba('waiting');
    load();
  }

  const retirar = (p: PackageRow) =>
    Alert.alert('Marcar retirada', `Confirmar a retirada de "${p.descricao}" (${p.unidade})?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Retirada', onPress: async () => { if (id) { await pickupPackage(id, p.id); load(); } } },
    ]);

  const remover = (p: PackageRow) =>
    Alert.alert('Remover encomenda', `Remover o registro de "${p.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { if (id) { await deletePackage(id, p.id); load(); } } },
    ]);

  if (!id) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Encomendas</Text>
        <Text style={styles.sub}>Registre o que chega na portaria e marque a retirada.</Text>

        {form ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Nova encomenda</Text>
            <Text style={styles.label}>Unidade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {unidades.map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() => setForm({ ...form, unit_id: u.id })}
                  style={[styles.chip, form.unit_id === u.id && styles.chipOn]}
                >
                  <Text style={[styles.chipText, form.unit_id === u.id && styles.chipTextOn]}>{u.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: caixa média, envelope"
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
            />
            {/* A unidade pode ter vários moradores: sem o nome, ninguém sabe
                de quem é o pacote. */}
            <Text style={styles.label}>Destinatário (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Ana Costa"
              value={form.recipient}
              onChangeText={(t) => setForm({ ...form, recipient: t })}
            />
            <Text style={styles.label}>Transportadora (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Correios"
              value={form.carrier}
              onChangeText={(t) => setForm({ ...form, carrier: t })}
            />
            <View style={styles.formActions}>
              <Pressable style={styles.btnGhost} onPress={() => setForm(null)}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, (!form.unit_id || !form.description.trim()) && styles.btnOff]}
                disabled={!form.unit_id || !form.description.trim()}
                onPress={registrar}
              >
                <Text style={styles.btnText}>Registrar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.addBtn}
            onPress={() => setForm({ unit_id: '', description: '', recipient: '', carrier: '' })}
          >
            <Text style={styles.addBtnText}>＋ Registrar encomenda</Text>
          </Pressable>
        )}

        <View style={styles.tabs}>
          {(['waiting', 'picked_up'] as const).map((t) => (
            <Pressable key={t} onPress={() => setAba(t)} style={[styles.tab, aba === t && styles.tabOn]}>
              <Text style={[styles.tabText, aba === t && styles.tabTextOn]}>
                {t === 'waiting' ? 'Aguardando' : 'Retiradas'}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>
            {aba === 'waiting' ? 'Nenhuma encomenda aguardando.' : 'Nada retirado ainda.'}
          </Text>
        ) : (
          rows.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pkgName}>{p.descricao}</Text>
                {p.destinatario ? <Text style={styles.pkgDest}>para {p.destinatario}</Text> : null}
                <Text style={styles.meta}>
                  {p.unidade}
                  {p.transportadora ? ` · ${p.transportadora}` : ''} · {quando(p.recebida_em)}
                </Text>
                {p.retirada_em && (
                  <Text style={styles.retirada}>
                    retirada em {quando(p.retirada_em)}
                    {p.retirada_por ? ` · ${p.retirada_por}` : ''}
                  </Text>
                )}
                <View style={styles.actions}>
                  {p.status === 'waiting' && (
                    <Pressable onPress={() => retirar(p)}>
                      <Text style={styles.actPrimary}>Marcar retirada</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => remover(p)}>
                    <Text style={styles.actDanger}>Remover</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  addBtn: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  addBtnText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.semibold },
  form: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg },
  formTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.md },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { height: 44, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: typography.size.md, color: colors.text, marginBottom: spacing.md, backgroundColor: colors.bg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm, backgroundColor: colors.bg },
  chipOn: { borderColor: colors.text, backgroundColor: colors.text },
  chipText: { fontSize: typography.size.sm, color: colors.text },
  chipTextOn: { color: colors.textOnAccent },
  formActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  btn: { backgroundColor: colors.text, borderRadius: radii.button, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  btnOff: { opacity: 0.4 },
  btnText: { color: colors.textOnAccent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  btnGhost: { borderRadius: radii.button, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  btnGhostText: { color: colors.textSecondary, fontSize: typography.size.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.text, borderColor: colors.text },
  tabText: { fontSize: typography.size.sm, color: colors.textSecondary },
  tabTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  pkgDest: { fontSize: typography.size.sm, color: colors.text, marginTop: 1 },
  pkgName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  retirada: { fontSize: typography.size.xs, color: colors.success, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  actPrimary: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  actDanger: { color: colors.error, fontSize: typography.size.sm },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, textAlign: 'center', marginTop: spacing.xl },
});
