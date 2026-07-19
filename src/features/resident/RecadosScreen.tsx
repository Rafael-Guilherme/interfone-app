import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { Recado, getRecados, useResidentCondo } from './resident.api';

const when = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Recados (②·5) — recados de visitantes + chamadas perdidas/recusadas. */
export function RecadosScreen() {
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [items, setItems] = useState<Recado[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try { setItems(await getRecados(id)); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Recados</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>Nenhum recado por aqui.</Text>
        ) : (
          items.map((r) => (
            <View key={`${r.kind}-${r.id}`} style={styles.card}>
              <View style={styles.icon}><Text style={styles.iconText}>{r.kind === 'call' ? '☎' : '✉'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.from}>{r.from}</Text>
                <Text style={styles.text}>{r.text}</Text>
              </View>
              <Text style={styles.when}>{when(r.at)}</Text>
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
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  iconText: { fontSize: typography.size.lg, color: colors.text },
  from: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  text: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  when: { fontSize: typography.size.xs, color: colors.textMuted },
});
