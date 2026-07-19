import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton } from '../../components/ui';
import { Area, MyReservation, getAreas, myReservations, createReservation, cancelReservation, useResidentCondo } from './resident.api';

const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
const HOURS = [8, 10, 12, 14, 16, 18, 20];
const DURATIONS = [1, 2, 3, 4];
const dayLabel = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
const nextDays = (n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d; });
const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Reservas de áreas comuns (②·6). */
export function ReservasScreen() {
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [areas, setAreas] = useState<Area[]>([]);
  const [mine, setMine] = useState<MyReservation[]>([]);
  const [areaId, setAreaId] = useState('');
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(14);
  const [dur, setDur] = useState(2);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [a, m] = await Promise.all([getAreas(id), myReservations(id)]);
    setAreas(a); setMine(m);
    if (!areaId && a[0]) setAreaId(a[0].id);
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const book = async () => {
    if (!id || !areaId) return;
    setBusy(true);
    try {
      const start = nextDays(7)[day]; start.setHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + dur * 3600000);
      await createReservation(id, areaId, start.toISOString(), end.toISOString());
      await load();
      Alert.alert('Reservado', 'Sua reserva foi confirmada.');
    } catch (e: any) {
      Alert.alert('Não foi possível reservar', e.message ?? 'Erro.');
    } finally { setBusy(false); }
  };

  const cancel = (r: MyReservation) =>
    Alert.alert('Cancelar reserva', `Cancelar ${r.area}?`, [
      { text: 'Não', style: 'cancel' },
      { text: 'Cancelar', style: 'destructive', onPress: async () => { if (id) { await cancelReservation(id, r.id); load(); } } },
    ]);

  if (!id) return null;
  const area = areas.find((a) => a.id === areaId);

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
                  <Text style={styles.resvWhen}>{fmt(r.starts_at)} – {fmt(r.ends_at)}</Text>
                </View>
                <Pressable onPress={() => cancel(r)}><Text style={styles.cancel}>Cancelar</Text></Pressable>
              </View>
            ))}
          </>
        )}

        <Text style={styles.section}>Nova reserva</Text>
        {areas.length === 0 ? (
          <Text style={styles.empty}>Nenhuma área disponível para reserva.</Text>
        ) : (
          <>
            <Chips items={areas.map((a) => ({ k: a.id, label: a.name }))} value={areaId} onChange={setAreaId} />
            {area && (area.capacity != null || area.fee_cents != null) && (
              <Text style={styles.areaInfo}>
                {[area.capacity != null ? `${area.capacity} pessoas` : null, area.fee_cents != null ? `Taxa ${money(area.fee_cents)}` : null].filter(Boolean).join(' · ')}
              </Text>
            )}
            <Text style={styles.label}>Dia</Text>
            <Chips items={nextDays(7).map((d, i) => ({ k: i, label: i === 0 ? 'Hoje' : dayLabel(d) }))} value={day} onChange={setDay} />
            <Text style={styles.label}>Início</Text>
            <Chips items={HOURS.map((h) => ({ k: h, label: `${h}h` }))} value={hour} onChange={setHour} />
            <Text style={styles.label}>Duração</Text>
            <Chips items={DURATIONS.map((h) => ({ k: h, label: `${h}h` }))} value={dur} onChange={setDur} />
            <View style={{ height: spacing.lg }} />
            <PrimaryButton label={busy ? 'Reservando…' : 'Reservar'} onPress={book} loading={busy} disabled={!areaId} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chips<T extends string | number>({ items, value, onChange }: { items: { k: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.chips}>
      {items.map((it) => (
        <Pressable key={String(it.k)} onPress={() => onChange(it.k)} style={[styles.chip, value === it.k && styles.chipOn]}>
          <Text style={[styles.chipText, value === it.k && styles.chipTextOn]}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
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
  cancel: { color: colors.error, fontSize: typography.size.sm },
  areaInfo: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm, fontWeight: typography.weight.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: typography.size.sm },
  chipTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
});
