import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { useActive } from '../../stores/active';
import { CondoDetail, getCondo, useManagerCondo } from './manager.api';
import { useManagerAccess } from './permissoes';

/** Início do gestor (③·2) — estatísticas + atalhos de gestão. */
export function PanelScreen() {
  const condo = useManagerCondo();
  const nav = useNavigation<any>();
  const leave = useActive((s) => s.leave);
  const acesso = useManagerAccess();
  const [detail, setDetail] = useState<CondoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  // Separado de `loading`: o RefreshControl só reflete o "puxar para atualizar".
  // Antes ele compartilhava o estado da carga inicial e a tela mostrava DOIS
  // indicadores ao mesmo tempo (o do topo e o do meio).
  const [refreshing, setRefreshing] = useState(false);

  const buscar = useCallback(async () => {
    if (!condo) return;
    setDetail(await getCondo(condo.condoId));
  }, [condo?.condoId]);

  const load = useCallback(async () => {
    try {
      await buscar();
    } finally {
      setLoading(false);
    }
  }, [buscar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await buscar();
    } finally {
      setRefreshing(false);
    }
  }, [buscar]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!condo) return null;

  const pendentes = detail?.counts.residents_pending ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.pad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Cabeçalho em cartão escuro, no mesmo padrão da home do morador. */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>{acesso.titular ? 'Gestor' : 'Sub-gestor'}</Text>
            <Pressable onPress={() => leave()} hitSlop={8} style={styles.trocar}>
              <Text style={styles.trocarText}>trocar ▾</Text>
            </Pressable>
          </View>
          <Text style={styles.heroCondo}>{detail?.name ?? condo.condoName}</Text>
          {pendentes > 0 && (
            <Pressable style={styles.alerta} onPress={() => nav.navigate('Residents')}>
              <Text style={styles.alertaText}>
                {pendentes} morador{pendentes > 1 ? 'es' : ''} aguardando aprovação ›
              </Text>
            </Pressable>
          )}
        </View>

        {loading && !detail ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            <View style={styles.stats}>
              <Stat label="Ativos" value={detail?.counts.residents_active ?? 0} />
              <Stat label="Pendentes" value={pendentes} highlight={pendentes > 0} />
              <Stat label="Blocos" value={detail?.counts.blocks ?? 0} />
              <Stat label="Unidades" value={detail?.counts.units ?? 0} />
            </View>

            <Text style={styles.secao}>Atalhos</Text>

            {/* Cada atalho só aparece com a permissão correspondente: um
                sub-gestor sem "announcements" não vê "Enviar comunicado". */}
            {acesso.pode('residents') && (
              <Action
                icone="👥"
                title="Aprovar moradores"
                desc={pendentes ? `${pendentes} aguardando` : 'Nenhum pendente'}
                badge={pendentes || undefined}
                onPress={() => nav.navigate('Residents')}
              />
            )}
            {acesso.pode('announcements') && (
              <Action icone="📣" title="Enviar comunicado" desc="Avise todos os moradores ou por bloco" onPress={() => nav.navigate('Announce')} />
            )}
            {acesso.pode('qrcodes') && (
              <Action icone="▦" title="QR codes" desc="Criar, gerenciar e compartilhar os QR da portaria" onPress={() => nav.navigate('QRCodes')} />
            )}
            {acesso.pode('packages') && (
              <Action icone="📦" title="Encomendas" desc="Registrar o que chega na portaria e marcar retiradas" onPress={() => nav.navigate('Packages')} />
            )}
            {acesso.pode('qrcodes') && (
              <Action icone="🔗" title="Compartilhar acesso" desc="QR e link da portaria para entregadores/visitantes" onPress={() => nav.navigate('ShareAccess')} />
            )}
            {/* "Sub-gestores e permissões" e "Editar informações" ficam na aba
                Gestão (StructureScreen); não duplicamos aqui. */}
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

function Action({ icone, title, desc, badge, onPress }: { icone: string; title: string; desc: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && styles.actionPressed]} onPress={onPress}>
      <View style={styles.actionIcone}>
        <Text style={styles.actionIconeText}>{icone}</Text>
      </View>
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
  hero: {
    backgroundColor: colors.dark,
    borderRadius: radii.card,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: {
    fontSize: typography.size.xs,
    color: colors.textOnDark,
    opacity: 0.6,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trocar: { paddingVertical: 2, paddingHorizontal: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  trocarText: { color: colors.textOnDark, fontSize: typography.size.xs, opacity: 0.9 },
  heroCondo: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.textOnDark, marginTop: spacing.sm },
  alerta: { marginTop: spacing.lg, backgroundColor: colors.accent, borderRadius: radii.button, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  alertaText: { color: colors.textOnAccent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg, alignItems: 'center' },
  statValue: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  statLabel: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2 },
  secao: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.semibold, marginBottom: spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  actionPressed: { borderColor: colors.accent, backgroundColor: colors.bg },
  actionIcone: { width: 40, height: 40, borderRadius: radii.button, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  actionIconeText: { fontSize: typography.size.lg },
  actionTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  actionDesc: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  badge: { minWidth: 24, height: 24, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.textOnAccent, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  chevron: { fontSize: 26, color: colors.textMuted },
});
