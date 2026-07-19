import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { Area, MyReservation, getAreas, myReservations, cancelReservation, useResidentCondo } from './resident.api';

const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
/** Só a data importa: a reserva é do dia inteiro. */
const diaBR = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

/**
 * Etapa 1 da reserva (②·6): escolher a área. O calendário de dias fica na
 * etapa seguinte (ReservaCalendarioScreen), porque a disponibilidade depende
 * da área escolhida.
 */
export function ReservasScreen() {
  const condo = useResidentCondo();
  const nav = useNavigation<any>();
  const id = condo?.condoId;
  const [areas, setAreas] = useState<Area[]>([]);
  const [mine, setMine] = useState<MyReservation[]>([]);
  const [carregando, setCarregando] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [a, m] = await Promise.all([getAreas(id), myReservations(id)]);
      setAreas(a);
      setMine(m);
    } finally {
      setCarregando(false);
    }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancel = (r: MyReservation) =>
    Alert.alert('Cancelar reserva', `Cancelar ${r.area} em ${diaBR(r.starts_at)}?`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar reserva',
        style: 'destructive',
        onPress: async () => { if (id) { await cancelReservation(id, r.id); load(); } },
      },
    ]);

  if (!id) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Reservas</Text>

        {mine.length > 0 && (
          <>
            <Text style={styles.section}>Minhas reservas</Text>
            {mine.map((r) => (
              <View key={r.id} style={styles.resv}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resvArea}>{r.area}</Text>
                  <Text style={styles.resvWhen}>{diaBR(r.starts_at)} · dia todo</Text>
                  <View style={[styles.badge, r.status === 'confirmed' ? styles.badgeOk : styles.badgePend]}>
                    <Text style={[styles.badgeText, r.status === 'confirmed' ? styles.badgeTextOk : styles.badgeTextPend]}>
                      {r.status === 'confirmed' ? '✓ Aprovada' : '⏳ Aguardando aprovação'}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => cancel(r)} hitSlop={8}>
                  <Text style={styles.cancel}>Cancelar</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Text style={styles.section}>Reservar uma área</Text>
        {carregando ? (
          <Text style={styles.empty}>Carregando…</Text>
        ) : areas.length === 0 ? (
          <Text style={styles.empty}>Nenhuma área disponível para reserva.</Text>
        ) : (
          areas.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => nav.navigate('ReservaCalendario', { areaId: a.id, areaNome: a.name })}
              style={({ pressed }) => [styles.area, pressed && styles.areaPressed]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.areaNome}>{a.name}</Text>
                <Text style={styles.areaInfo}>
                  {[
                    a.capacity != null ? `${a.capacity} pessoas` : null,
                    a.fee_cents != null ? `Taxa ${money(a.fee_cents)}` : null,
                    a.max_days_ahead != null ? `Até ${a.max_days_ahead} dias à frente` : null,
                  ].filter(Boolean).join(' · ') || 'Toque para ver os dias disponíveis'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.md },
  section: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.semibold, marginTop: spacing.xl, marginBottom: spacing.md },
  empty: { color: colors.textSecondary, fontSize: typography.size.md },
  resv: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  resvArea: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  resvWhen: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radii.pill },
  badgeOk: { backgroundColor: colors.successBg },
  badgePend: { backgroundColor: colors.warningBg },
  badgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  badgeTextOk: { color: colors.success },
  badgeTextPend: { color: colors.warning },
  cancel: { color: colors.error, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  area: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  areaPressed: { backgroundColor: colors.bg, borderColor: colors.accent },
  areaNome: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  areaInfo: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 26, color: colors.textMuted, lineHeight: 28 },
});
