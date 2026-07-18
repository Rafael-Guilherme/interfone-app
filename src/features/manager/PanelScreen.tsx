import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { CondoDetail, getCondo, useManagerCondo } from './manager.api';

/** Início do síndico (③·2) — estatísticas + atalhos de gestão. */
export function PanelScreen() {
  const condo = useManagerCondo();
  const nav = useNavigation<any>();
  const [detail, setDetail] = useState<CondoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!condo) return;
    try {
      setDetail(await getCondo(condo.condoId));
    } finally {
      setLoading(false);
    }
  }, [condo?.condoId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!condo) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <View style={styles.head}>
          <View>
            <Text style={styles.hi}>Gestão</Text>
            <Text style={styles.condo}>{detail?.name ?? condo.condoName}</Text>
          </View>
          <Pressable onPress={() => nav.navigate('InterfoneSelect')} hitSlop={8}>
            <Text style={styles.switch}>▾ trocar</Text>
          </Pressable>
        </View>

        {loading && !detail ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            <View style={styles.stats}>
              <Stat label="Ativos" value={detail?.counts.residents_active ?? 0} />
              <Stat label="Pendentes" value={detail?.counts.residents_pending ?? 0} highlight={(detail?.counts.residents_pending ?? 0) > 0} />
              <Stat label="Blocos" value={detail?.counts.blocks ?? 0} />
              <Stat label="Unidades" value={detail?.counts.units ?? 0} />
            </View>

            <Action title="Aprovar moradores" desc={detail?.counts.residents_pending ? `${detail.counts.residents_pending} aguardando` : 'Nenhum pendente'} badge={detail?.counts.residents_pending || undefined} onPress={() => nav.navigate('Residents')} />
            <Action title="Enviar comunicado" desc="Avise todos os moradores ou por bloco" onPress={() => nav.navigate('Announce')} />
            <Action title="QR codes" desc="Criar, gerenciar e compartilhar os QR da portaria" onPress={() => nav.navigate('QRCodes')} />
            <Action title="Compartilhar acesso" desc="QR e link da portaria para entregadores/visitantes" onPress={() => nav.navigate('ShareAccess')} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && { color: colors.accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function Action({ title, desc, badge, onPress }: { title: string; desc: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && styles.actionPressed]} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDesc}>{desc}</Text>
      </View>
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, flexGrow: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hi: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  condo: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginTop: 2 },
  switch: { color: colors.textSecondary, fontSize: typography.size.sm, paddingTop: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.xl },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg, alignItems: 'center' },
  statValue: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  statLabel: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  actionPressed: { borderColor: colors.text },
  actionTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  actionDesc: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  badge: { minWidth: 24, height: 24, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.textOnAccent, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  chevron: { fontSize: 26, color: colors.textMuted },
});
