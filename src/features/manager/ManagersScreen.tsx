import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../components/ui';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import {
  ManagerRow,
  PERMISSOES,
  listManagers,
  setManagerPermissions,
  setManagerStatus,
  useManagerCondo,
} from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'Managers'>;

/**
 * Sub-gestores (③) — aprovar quem pediu acesso e escolher o que cada um pode
 * fazer. Só o gestor titular chega nesta tela; a API recusa o resto.
 */
export function ManagersScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const id = condo?.condoId;
  const [rows, setRows] = useState<ManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setRows(await listManagers(id));
      setErro(null);
    } catch (e: any) {
      setErro(e.message ?? 'Não foi possível carregar.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  /** Alterna uma permissão e persiste a lista inteira. */
  async function alternar(m: ManagerRow, perm: string) {
    if (!id) return;
    const proximas = m.permissions.includes(perm)
      ? m.permissions.filter((p) => p !== perm)
      : [...m.permissions, perm];
    setSalvando(m.profile_id);
    // Otimista: a lista é pequena e o retorno confirma.
    setRows((rs) => rs.map((r) => (r.profile_id === m.profile_id ? { ...r, permissions: proximas } : r)));
    try {
      await setManagerPermissions(id, m.profile_id, proximas);
    } catch (e: any) {
      Alert.alert('Permissões', e.message ?? 'Falha ao salvar.');
      load();
    } finally {
      setSalvando(null);
    }
  }

  const agir = (m: ManagerRow, action: 'approve' | 'reject' | 'remove') => {
    const textos = {
      approve: `Aprovar ${m.name} como sub-gestor?`,
      reject: `Rejeitar o acesso de ${m.name}?`,
      remove: `Remover ${m.name} da gestão deste interfone?`,
    };
    Alert.alert('Sub-gestor', textos[action], [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: action === 'approve' ? 'default' : 'destructive',
        onPress: async () => { if (id) { await setManagerStatus(id, m.profile_id, action); load(); } },
      },
    ]);
  };

  if (!id) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Sub-gestores</Text>
        <Text style={styles.sub}>
          Divida a gestão do interfone. Cada sub-gestor só acessa o que você liberar.
        </Text>

        {erro ? (
          <Text style={styles.erro}>{erro}</Text>
        ) : loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          rows.map((m) => (
            <View key={m.profile_id} style={styles.card}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>
                    {m.name} {m.is_me ? '(você)' : ''}
                  </Text>
                  <Text style={styles.meta}>
                    {m.email} · {m.role === 'manager' ? 'gestor titular' : 'sub-gestor'}
                    {m.status !== 'active' ? ` · ${m.status}` : ''}
                  </Text>
                </View>
                {m.role === 'sub_manager' && (
                  <View style={styles.headActions}>
                    {m.status === 'pending' && (
                      <Pressable onPress={() => agir(m, 'approve')}>
                        <Text style={styles.actOk}>Aprovar</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => agir(m, 'remove')}>
                      <Text style={styles.actDanger}>Remover</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {m.role === 'manager' ? (
                <Text style={styles.todas}>Acesso total — o titular não tem restrições.</Text>
              ) : (
                <View style={styles.perms}>
                  {PERMISSOES.map((p) => (
                    <View key={p.id} style={styles.permRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.permLabel}>{p.label}</Text>
                        <Text style={styles.permDesc}>{p.desc}</Text>
                      </View>
                      <Switch
                        value={m.permissions.includes(p.id)}
                        disabled={salvando === m.profile_id || m.status !== 'active'}
                        onValueChange={() => alternar(m, p.id)}
                        trackColor={{ true: colors.success, false: colors.border }}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        <Text style={styles.dica}>
          Para adicionar um sub-gestor, peça que ele entre no app, escolha “Gestor” e informe o código{' '}
          <Text style={{ fontWeight: typography.weight.bold }}>do interfone</Text>. O pedido aparece aqui para aprovação.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  erro: { color: colors.error, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headActions: { flexDirection: 'row', gap: spacing.md },
  nome: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  actOk: { color: colors.success, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  actDanger: { color: colors.error, fontSize: typography.size.sm },
  todas: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.md, fontStyle: 'italic' },
  perms: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  permLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text },
  permDesc: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 1 },
  dica: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: spacing.lg, lineHeight: 18 },
});
