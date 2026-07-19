import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ui';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import type { ManagerStackParamList } from '../../navigation/types';
import { ResidentRow, getResidents, setResident, residentsPdfLink, useManagerCondo } from './manager.api';

type Props = NativeStackScreenProps<ManagerStackParamList, 'Residents'>;
type Tab = 'pending' | 'active';

/**
 * Abre a conversa no WhatsApp. É só um deep link `wa.me` — sem integração com
 * a API do WhatsApp, conforme o plano. O número vai só com dígitos e assume
 * DDI 55 quando o morador cadastrou no formato nacional.
 */
async function abrirWhatsApp(r: ResidentRow) {
  if (!r.phone) return;
  const digitos = r.phone.replace(/\D/g, '');
  const numero = digitos.startsWith('55') ? digitos : `55${digitos}`;
  const texto = encodeURIComponent(`Olá, ${r.name.split(' ')[0]}! Aqui é da administração do condomínio.`);
  const url = `https://wa.me/${numero}?text=${texto}`;
  if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  else Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp neste aparelho.');
}

/** Moradores · aprovação (③·3) — Pendentes / Ativos, aprovar/rejeitar. */
export function ResidentsScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  /** Pede o link assinado e entrega ao navegador do sistema. */
  const exportarPdf = async () => {
    if (!condo) return;
    setExportando(true);
    try {
      const { url } = await residentsPdfLink(condo.condoId);
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Exportar', e.message ?? 'Não foi possível gerar o PDF.');
    } finally {
      setExportando(false);
    }
  };

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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <ScreenHeader
          title="Moradores"
          subtitle="Aprove quem pediu acesso e fale com os moradores ativos."
          onBack={() => navigation.goBack()}
        />

        <Pressable style={styles.exportBtn} onPress={exportarPdf} disabled={exportando}>
          <Text style={styles.exportText}>{exportando ? 'Gerando…' : '⤓ Exportar lista em PDF'}</Text>
        </Pressable>

        <View style={styles.tabs}>
          {(['pending', 'active'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
                {t === 'pending' ? 'Pendentes' : 'Ativos'}
              </Text>
            </Pressable>
          ))}
        </View>

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
              {tab === 'pending' ? (
                <View style={styles.actions}>
                  <Pressable style={[styles.btn, styles.reject]} disabled={actingId === r.profile_id} onPress={() => act(r.profile_id, 'reject')}>
                    <Text style={styles.rejectText}>✕</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.approve]} disabled={actingId === r.profile_id} onPress={() => act(r.profile_id, 'approve')}>
                    <Text style={styles.approveText}>✓</Text>
                  </Pressable>
                </View>
              ) : (
                r.phone && (
                  <Pressable style={[styles.btn, styles.whats]} onPress={() => abrirWhatsApp(r)}>
                    <Text style={styles.whatsText}>✆</Text>
                  </Pressable>
                )
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
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  tabOn: { backgroundColor: colors.text, borderColor: colors.text },
  tabText: { color: colors.text, fontSize: typography.size.sm },
  tabTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  body: { padding: spacing.xl, paddingBottom: spacing.xxl },
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
  exportBtn: { marginBottom: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  exportText: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  whats: { backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.success },
  whatsText: { color: colors.success, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
});
