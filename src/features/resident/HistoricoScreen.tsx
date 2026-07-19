import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { CallLog, getCallHistory, useResidentCondo } from './resident.api';

const when = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** "3 min 20 s" a partir dos segundos cheios. */
const duration = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)} min ${s % 60}s`);

const LABEL: Record<CallLog['status'], { text: string; color: string }> = {
  answered: { text: 'Atendida', color: colors.success },
  ended: { text: 'Atendida', color: colors.success },
  missed: { text: 'Não atendida', color: colors.accent },
  declined: { text: 'Recusada', color: colors.textMuted },
  ringing: { text: 'Em andamento', color: colors.textSecondary },
};

/** Histórico de chamadas das unidades do morador — todos os desfechos. */
export function HistoricoScreen() {
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [items, setItems] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setItems(await getCallHistory(id));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Histórico</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>Nenhuma chamada ainda.</Text>
        ) : (
          items.map((c) => {
            const tag = LABEL[c.status];
            return (
              <View key={c.id} style={styles.card}>
                <View style={styles.icon}>
                  <Text style={styles.iconText}>{c.media === 'video' ? '📹' : '☎'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.from}>{c.from}</Text>
                  <Text style={styles.sub}>
                    <Text style={{ color: tag.color }}>{tag.text}</Text>
                    {c.duration_s != null ? ` · ${duration(c.duration_s)}` : ''}
                    {c.unit ? ` · ${c.unit}` : ''}
                  </Text>
                </View>
                <Text style={styles.when}>{when(c.started_at)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  iconText: { fontSize: typography.size.lg, color: colors.text },
  from: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  when: { fontSize: typography.size.xs, color: colors.textMuted },
});
