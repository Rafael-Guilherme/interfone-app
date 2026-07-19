import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { BackButton, PrimaryButton, Field } from '../../components/ui';
import { mascaraTelefoneOuRamal } from '../../lib/mask';
import {
  InternalContact,
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  useManagerCondo,
} from './manager.api';

/**
 * Cadastro dos contatos internos (portaria, zelador, administração) que o
 * morador vê na aba Contatos. Só o gestor titular / sub-gestor com permissão
 * "settings" chega aqui (a API recusa o resto).
 */
export function ContactsManageScreen() {
  const nav = useNavigation<any>();
  const condo = useManagerCondo();
  const id = condo?.condoId;
  const [itens, setItens] = useState<InternalContact[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<{ name: string; phone: string; note: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try { setItens(await listContacts(id)); } finally { setCarregando(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const salvar = async () => {
    if (!id || !form?.name.trim() || !form.phone.trim()) return;
    setSalvando(true);
    try {
      await createContact(id, { name: form.name.trim(), phone: form.phone.trim(), note: form.note.trim() || null });
      setForm(null);
      load();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const alternar = async (c: InternalContact) => {
    if (id) { await updateContact(id, c.id, { enabled: !c.enabled }); load(); }
  };

  const remover = (c: InternalContact) =>
    Alert.alert('Remover contato', `Remover "${c.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { if (id) { await deleteContact(id, c.id); load(); } } },
    ]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <BackButton onPress={() => nav.goBack()} />
        <Text style={styles.title}>Contatos internos</Text>
        <Text style={styles.sub}>Portaria, zeladoria e administração que o morador pode ligar pelo app.</Text>

        {carregando ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            {itens.length === 0 && <Text style={styles.empty}>Nenhum contato cadastrado ainda.</Text>}
            {itens.map((c) => (
              <View key={c.id} style={[styles.card, !c.enabled && styles.cardOff]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{c.name}</Text>
                  <Text style={styles.meta}>
                    {c.phone}
                    {c.note ? ` · ${c.note}` : ''}
                  </Text>
                </View>
                <Switch value={c.enabled} onValueChange={() => alternar(c)} trackColor={{ true: colors.accent }} />
                <Pressable hitSlop={8} onPress={() => remover(c)} accessibilityLabel={`Remover ${c.name}`}>
                  <Text style={styles.del}>✕</Text>
                </Pressable>
              </View>
            ))}

            {form ? (
              <View style={styles.formBox}>
                <Field label="Nome" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Ex.: Portaria" />
                <Field label="Telefone / ramal" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: mascaraTelefoneOuRamal(t) })} keyboardType="phone-pad" placeholder="Ex.: 1145 ou (11) 99999-0000" />
                <Field label="Observação (opcional)" value={form.note} onChangeText={(t) => setForm({ ...form, note: t })} placeholder="Ex.: 24h, emergências" />
                <PrimaryButton label={salvando ? 'Salvando…' : 'Adicionar contato'} onPress={salvar} loading={salvando} disabled={!form.name.trim() || !form.phone.trim()} />
                <Pressable onPress={() => setForm(null)} style={styles.cancelar}><Text style={styles.cancelarText}>Cancelar</Text></Pressable>
              </View>
            ) : (
              <Pressable style={styles.add} onPress={() => setForm({ name: '', phone: '', note: '' })}>
                <Text style={styles.addText}>＋ Novo contato</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.sm },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl, lineHeight: 19 },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  cardOff: { opacity: 0.55 },
  nome: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  del: { fontSize: typography.size.md, color: colors.error },
  formBox: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.sm },
  cancelar: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  cancelarText: { color: colors.textSecondary, fontSize: typography.size.sm },
  add: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginTop: spacing.sm },
  addText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
});
