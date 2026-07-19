import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { UnitQueue, QueueMember, getCallQueue, setCallQueue, useResidentCondo } from './resident.api';

/**
 * Fila de chamada da unidade (transbordo).
 *
 * O interfone toca em um morador por vez, na ordem definida aqui. Quem define é
 * o primeiro morador cadastrado na unidade; para os demais a tela é só leitura.
 */
export function FilaChamadaScreen() {
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [unidades, setUnidades] = useState<UnitQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setUnidades(await getCallQueue(id));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  /** Persiste a unidade inteira: a ordem do array é a ordem de toque. */
  async function salvar(u: UnitQueue, moradores: QueueMember[]) {
    if (!id) return;
    if (!moradores.some((m) => m.na_fila)) {
      Alert.alert('Fila de chamada', 'Ao menos um morador precisa estar na fila — senão o interfone nunca toca.');
      return;
    }
    setUnidades((us) => us.map((x) => (x.unit_id === u.unit_id ? { ...x, moradores } : x)));
    setSalvando(true);
    try {
      await setCallQueue(
        id,
        u.unit_id,
        moradores.map((m) => ({ profile_id: m.profile_id, na_fila: m.na_fila })),
      );
    } catch (e: any) {
      Alert.alert('Fila de chamada', e.message ?? 'Não foi possível salvar.');
      load();
    } finally {
      setSalvando(false);
    }
  }

  const mover = (u: UnitQueue, i: number, delta: number) => {
    const arr = [...u.moradores];
    const j = i + delta;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    salvar(u, arr.map((m, k) => ({ ...m, ordem: k + 1 })));
  };

  const alternar = (u: UnitQueue, i: number) => {
    const arr = u.moradores.map((m, k) => (k === i ? { ...m, na_fila: !m.na_fila } : m));
    salvar(u, arr);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Fila de chamada</Text>
        <Text style={styles.sub}>
          Quando alguém chama sua unidade, o interfone toca em um morador por vez, nesta ordem.
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : unidades.length === 0 ? (
          <Text style={styles.empty}>Você ainda não tem unidade vinculada.</Text>
        ) : (
          unidades.map((u) => (
            <View key={u.unit_id} style={styles.card}>
              <Text style={styles.unidade}>{u.unidade}</Text>
              {!u.posso_editar && (
                <Text style={styles.leitura}>
                  Somente leitura — quem define a fila é o primeiro morador cadastrado nesta unidade.
                </Text>
              )}

              {u.moradores.map((m, i) => (
                <View key={m.profile_id} style={[styles.linha, !m.na_fila && styles.linhaOff]}>
                  <Text style={styles.pos}>{m.na_fila ? `${u.moradores.filter((x, k) => x.na_fila && k <= i).length}º` : '—'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>
                      {m.nome}
                      {m.sou_eu ? ' (você)' : ''}
                    </Text>
                    <Text style={styles.estado}>{m.na_fila ? 'recebe a chamada' : 'fora da fila'}</Text>
                  </View>

                  {u.posso_editar && (
                    <View style={styles.acoes}>
                      <Pressable onPress={() => mover(u, i, -1)} disabled={i === 0 || salvando} hitSlop={8}>
                        <Text style={[styles.seta, i === 0 && styles.setaOff]}>▲</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => mover(u, i, 1)}
                        disabled={i === u.moradores.length - 1 || salvando}
                        hitSlop={8}
                      >
                        <Text style={[styles.seta, i === u.moradores.length - 1 && styles.setaOff]}>▼</Text>
                      </Pressable>
                      <Switch
                        value={m.na_fila}
                        disabled={salvando}
                        onValueChange={() => alternar(u, i)}
                        trackColor={{ true: colors.success, false: colors.border }}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}

        <Text style={styles.dica}>
          Cada morador da fila toca por um tempo antes de passar ao próximo. Se ninguém atender, a
          chamada vira uma notificação em Recados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg, lineHeight: 20 },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  unidade: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.sm },
  leitura: { fontSize: typography.size.xs, color: colors.warning, marginBottom: spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  linhaOff: { opacity: 0.55 },
  pos: { width: 28, fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary },
  nome: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.text },
  estado: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 1 },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  seta: { fontSize: typography.size.md, color: colors.text },
  setaOff: { color: colors.border },
  dica: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 18 },
});
