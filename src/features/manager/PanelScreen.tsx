import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { useSession } from '../../stores/session';
import type { ManagerStackParamList } from '../../navigation/types';
import { CondoDetail, getCondo, useManagerCondo } from './manager.api';

type Props = NativeStackScreenProps<ManagerStackParamList, 'Panel'>;

/** Painel do condomínio (③·2) — estatísticas + atalhos de gestão. */
export function PanelScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const signOut = useSession((s) => s.signOut);
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
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.pad}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={styles.hi}>Gestão</Text>
        <Text style={styles.condo}>{detail?.name ?? condo.condoName}</Text>
        {detail?.address?.city ? (
          <Text style={styles.addr}>{[detail.address.street, detail.address.district, detail.address.city].filter(Boolean).join(', ')}</Text>
        ) : null}

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

            <Action
              title="Aprovar moradores"
              desc={detail?.counts.residents_pending ? `${detail.counts.residents_pending} aguardando` : 'Nenhum pendente'}
              badge={detail?.counts.residents_pending || undefined}
              onPress={() => navigation.navigate('Residents')}
            />
            <Action
              title="Compartilhar acesso"
              desc="QR e link da portaria para entregadores/visitantes"
              onPress={() => navigation.navigate('ShareAccess')}
            />
          </>
        )}

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
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
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, flexGrow: 1 },
  hi: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  condo: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginTop: 2 },
  addr: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4 },
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
  signOut: { marginTop: 'auto', alignItems: 'center', paddingTop: spacing.xxl },
  signOutText: { color: colors.textSecondary, fontSize: typography.size.sm },
});
