import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { BackButton } from '../../components/ui';
import { Calendario, Legenda } from '../../components/Calendario';
import {
  DiaArea,
  Reservation,
  areaCalendar,
  listReservations,
  reserveAsManagement,
  setAreaBlock,
  useManagerCondo,
} from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'AreaBookings'>;

const diaBR = (dia: string) => {
  const [a, m, d] = dia.split('-');
  return `${d}/${m}/${a}`;
};
/** A reserva é do dia inteiro; a hora guardada é sempre 00:00 UTC. */
const diaDaReserva = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

/**
 * Agenda da área comum para o gestor: calendário de ocupação + lista dos
 * próximos agendamentos. Tocar num dia abre as ações possíveis para ele.
 */
export function AreaBookingsScreen({ route, navigation }: Props) {
  const { areaId, areaName } = route.params;
  const condo = useManagerCondo();
  const [dias, setDias] = useState<DiaArea[] | null>(null);
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!condo) return;
    try {
      const [cal, res] = await Promise.all([
        areaCalendar(condo.condoId, areaId),
        listReservations(condo.condoId, areaId),
      ]);
      setDias(cal.days);
      setRows(res);
    } finally {
      setLoading(false);
    }
  }, [condo?.condoId, areaId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const agir = async (fn: () => Promise<unknown>, erroTitulo: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e: any) {
      Alert.alert(erroTitulo, e.message ?? 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  /** Menu de ações do dia — muda conforme o que já existe nele. */
  const tocarDia = (d: DiaArea) => {
    if (!condo || busy) return;
    const data = diaBR(d.day);

    if (d.status === 'bloqueado') {
      Alert.alert(`${data} — indisponível`, d.reason ?? 'Sem motivo registrado.', [
        { text: 'Fechar', style: 'cancel' },
        {
          text: 'Liberar o dia',
          onPress: () => agir(() => setAreaBlock(condo.condoId, areaId, d.day, false), 'Erro ao liberar'),
        },
      ]);
      return;
    }

    if (d.status === 'ocupado' || d.status === 'administracao' || d.status === 'meu') {
      Alert.alert(
        `${data} — reservado`,
        d.status === 'ocupado' ? 'Reservado por um morador.' : 'Reservado pela administração.',
        [{ text: 'Fechar', style: 'cancel' }],
      );
      return;
    }

    // Dia livre (ou fora da janela do morador, que a administração ignora).
    Alert.alert(data, 'O que deseja fazer com este dia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Marcar indisponível',
        onPress: () =>
          agir(() => setAreaBlock(condo.condoId, areaId, d.day, true), 'Erro ao bloquear'),
      },
      {
        text: 'Reservar p/ administração',
        onPress: () =>
          agir(() => reserveAsManagement(condo.condoId, areaId, d.day), 'Erro ao reservar'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{areaName}</Text>
        <Text style={styles.sub}>
          Toque num dia para marcá-lo como indisponível ou reservar para a administração.
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            <Legenda />
            {dias && (
              <Calendario
                days={dias}
                onSelect={tocarDia}
                // O gestor age em QUALQUER dia, inclusive nos que estão fora
                // da janela de antecedência do morador.
                selecionavel={() => true}
              />
            )}

            <Text style={styles.section}>Próximos agendamentos</Text>
            {rows.length === 0 ? (
              <Text style={styles.empty}>Nenhum agendamento futuro.</Text>
            ) : (
              rows.map((r) => (
                <View key={r.id} style={styles.card}>
                  <Text style={styles.date}>{diaDaReserva(r.starts_at)} · dia todo</Text>
                  <Text style={styles.resident}>{r.resident}</Text>
                  {r.unit ? <Text style={styles.unit}>{r.unit}</Text> : null}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.sm },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl, lineHeight: 19 },
  section: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.semibold, marginTop: spacing.lg, marginBottom: spacing.md },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, textAlign: 'center', paddingVertical: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  date: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text, marginBottom: 2 },
  resident: { fontSize: typography.size.sm, color: colors.text },
  unit: { fontSize: typography.size.xs, color: colors.textSecondary },
});
