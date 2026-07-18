import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { Reservation, listReservations, useManagerCondo } from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'AreaBookings'>;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Agendamentos de uma área comum. */
export function AreaBookingsScreen({ route, navigation }: Props) {
  const { areaId, areaName } = route.params;
  const condo = useManagerCondo();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condo) return;
    listReservations(condo.condoId, areaId).then(setRows).finally(() => setLoading(false));
  }, [condo?.condoId, areaId]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>{areaName}</Text>
        <Text style={styles.sub}>Próximos agendamentos</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>Nenhum agendamento futuro.</Text>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.when}>
                <Text style={styles.date}>{fmt(r.starts_at)}</Text>
                <Text style={styles.dateSep}>até {fmt(r.ends_at)}</Text>
              </View>
              <View>
                <Text style={styles.resident}>{r.resident}</Text>
                {r.unit ? <Text style={styles.unit}>{r.unit}</Text> : null}
              </View>
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
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.md },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  when: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.xs },
  date: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  dateSep: { fontSize: typography.size.sm, color: colors.textSecondary },
  resident: { fontSize: typography.size.sm, color: colors.text },
  unit: { fontSize: typography.size.xs, color: colors.textSecondary },
});
