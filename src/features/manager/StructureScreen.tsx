import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { PromptModal } from './PromptModal';
import {
  Structure, UnitRow, getStructure, useManagerCondo,
  createBlock, updateBlock, deleteBlock, createUnit, updateUnit, deleteUnit,
} from './manager.api';

type Prompt = { title: string; initial?: string; placeholder?: string; run: (v: string) => Promise<unknown> };

/** Gestão (③·4) — editar interfone, blocos & unidades (com guard de moradores). */
export function StructureScreen() {
  const condo = useManagerCondo();
  const nav = useNavigation<any>();
  const [st, setSt] = useState<Structure | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  const id = condo?.condoId;
  const load = useCallback(async () => {
    if (!id) return;
    try { setSt(await getStructure(id)); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const run = async (fn: () => Promise<unknown>) => {
    try { await fn(); await load(); } catch (e: any) { Alert.alert('Não foi possível', e.message ?? 'Erro.'); }
  };
  const confirmDelete = (label: string, fn: () => Promise<unknown>) =>
    Alert.alert('Remover', `Remover ${label}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => run(fn) },
    ]);

  if (!id) return null;

  const renderUnit = (u: UnitRow) => (
    <View key={u.id} style={styles.unit}>
      <Text style={styles.unitNum}>{u.number}</Text>
      {u.residents > 0 && <Text style={styles.unitRes}>{u.residents}👤</Text>}
      <Pressable hitSlop={8} onPress={() => setPrompt({ title: 'Renomear unidade', initial: u.number, run: (v) => updateUnit(id, u.id, v) })}>
        <Text style={styles.edit}>✎</Text>
      </Pressable>
      <Pressable hitSlop={8} onPress={() => confirmDelete(`unidade ${u.number}`, () => deleteUnit(id, u.id))}>
        <Text style={styles.del}>✕</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} refreshControl={undefined}>
        <Text style={styles.title}>Gestão do interfone</Text>

        <Pressable style={styles.editInfo} onPress={() => nav.navigate('EditInfo')}>
          <Text style={styles.editInfoText}>Editar informações (nome, foto, endereço, raio) ›</Text>
        </Pressable>

        {loading && !st ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            {st?.blocks.map((b) => (
              <View key={b.id} style={styles.block}>
                <View style={styles.blockHead}>
                  <Text style={styles.blockName}>Bloco {b.name}</Text>
                  <View style={styles.blockActions}>
                    <Pressable hitSlop={8} onPress={() => setPrompt({ title: 'Renomear bloco', initial: b.name, run: (v) => updateBlock(id, b.id, v) })}><Text style={styles.edit}>✎</Text></Pressable>
                    <Pressable hitSlop={8} onPress={() => confirmDelete(`bloco ${b.name}`, () => deleteBlock(id, b.id))}><Text style={styles.del}>✕</Text></Pressable>
                  </View>
                </View>
                <View style={styles.units}>{b.units.map(renderUnit)}</View>
                <Pressable onPress={() => setPrompt({ title: `Nova unidade no bloco ${b.name}`, placeholder: 'Ex.: 101', run: (v) => createUnit(id, v, b.id) })}>
                  <Text style={styles.addUnit}>＋ unidade</Text>
                </Pressable>
              </View>
            ))}

            {(st?.units_no_block.length ?? 0) > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockName}>Unidades</Text>
                <View style={styles.units}>{st!.units_no_block.map(renderUnit)}</View>
              </View>
            )}

            {st && !st.has_blocks && (
              <Pressable onPress={() => setPrompt({ title: 'Nova unidade', placeholder: 'Ex.: Casa / 101', run: (v) => createUnit(id, v) })}>
                <Text style={styles.addUnit}>＋ unidade</Text>
              </Pressable>
            )}

            <Pressable style={styles.addBlock} onPress={() => setPrompt({ title: 'Novo bloco', placeholder: 'Ex.: A', run: (v) => createBlock(id, v) })}>
              <Text style={styles.addBlockText}>＋ Adicionar bloco</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <PromptModal
        visible={!!prompt}
        title={prompt?.title ?? ''}
        initial={prompt?.initial}
        placeholder={prompt?.placeholder}
        onCancel={() => setPrompt(null)}
        onConfirm={(v) => { const p = prompt; setPrompt(null); if (p) run(() => p.run(v)); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  editInfo: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl },
  editInfoText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
  block: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  blockName: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  blockActions: { flexDirection: 'row', gap: spacing.lg },
  units: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  unit: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingVertical: 6, paddingHorizontal: spacing.md },
  unitNum: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  unitRes: { fontSize: typography.size.xs, color: colors.textSecondary },
  edit: { fontSize: typography.size.md, color: colors.textSecondary },
  del: { fontSize: typography.size.md, color: colors.error },
  addUnit: { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.medium, marginTop: spacing.xs },
  addBlock: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginTop: spacing.sm },
  addBlockText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
});
