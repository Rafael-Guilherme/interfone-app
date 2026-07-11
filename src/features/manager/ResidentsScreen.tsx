import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import type { ManagerStackParamList } from '../../navigation/types';
import { ResidentRow, getResidents, setResident, useManagerCondo } from './manager.api';

type Props = NativeStackScreenProps<ManagerStackParamList, 'Residents'>;
type Tab = 'pending' | 'active';

/** Moradores · aprovação (③·3) — Pendentes / Ativos, aprovar/rejeitar. */
export function ResidentsScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(
    async (t: Tab) => {
      if (!condo) return;
      setLoading(true);
      try {
        setRows(await getResidents(condo.condoId, t));
      } finally {
        setLoading(false);
      }
    },
    [condo?.condoId],
  );

  React.useEffect(() => {
    load(tab);
  }, [tab, load]);

  const act = async (pid: string, action: 'approve' | 'reject') => {
    if (!condo) return;
    setActingId(pid);
    try {
      await setResident(condo.condoId, pid, action);
      setRows((rs) => rs.filter((r) => r.profile_id !== pid));
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha na operação.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Moradores</Text>
      </View>

      <View style={styles.tabs}>
        {(['pending', 'active'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
              {t === 'pending' ? 'Pendentes' : 'Ativos'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>{tab === 'pending' ? 'Nenhum morador aguardando.' : 'Nenhum morador ativo.'}</Text>
        ) : (
          rows.map((r) => (
            <View key={r.profile_id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{r.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={styles.meta}>{r.units.join(', ') || 'sem unidade'} · {r.email}</Text>
              </View>
              {tab === 'pending' && (
                <View style={styles.actions}>
                  <Pressable style={[styles.btn, styles.reject]} disabled={actingId === r.profile_id} onPress={() => act(r.profile_id, 'reject')}>
                    <Text style={styles.rejectText}>✕</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.approve]} disabled={actingId === r.profile_id} onPress={() => act(r.profile_id, 'approve')}>
                    <Text style={styles.approveText}>✓</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.sm },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, marginVertical: spacing.lg },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  tabOn: { backgroundColor: colors.text, borderColor: colors.text },
  tabText: { color: colors.text, fontSize: typography.size.sm },
  tabTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl, fontSize: typography.size.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md, gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText: { color: colors.text, fontWeight: typography.weight.bold },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  reject: { backgroundColor: colors.errorBg },
  rejectText: { color: colors.error, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  approve: { backgroundColor: colors.success },
  approveText: { color: colors.textOnAccent, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
});
