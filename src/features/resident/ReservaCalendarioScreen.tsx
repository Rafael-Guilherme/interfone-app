import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { BackButton, PrimaryButton } from '../../components/ui';
import { Calendario, Legenda } from '../../components/Calendario';
import { AreaCalendar, getAreaCalendar, createReservation, useResidentCondo } from './resident.api';

const diaBR = (dia: string) => {
  const [a, m, d] = dia.split('-');
  return `${d}/${m}/${a}`;
};

/**
 * Etapa 2 da reserva: escolher o dia. A área só é reservável pelo dia inteiro,
 * então não há seleção de horário — o dia É a reserva.
 */
export function ReservaCalendarioScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { areaId, areaNome } = route.params ?? {};
  const condo = useResidentCondo();
  const id = condo?.condoId;

  const [cal, setCal] = useState<AreaCalendar | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !areaId) return;
    try {
      setCal(await getAreaCalendar(id, areaId));
    } catch (e: any) {
      setErro(e.message ?? 'Não foi possível carregar o calendário.');
    }
  }, [id, areaId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reservar = async () => {
    if (!id || !dia) return;
    setBusy(true);
    try {
      await createReservation(id, areaId, dia);
      Alert.alert(
        'Reserva solicitada com sucesso',
        `${areaNome} · ${diaBR(dia)} (dia todo).\n\nSua reserva foi enviada e aguarda a aprovação do gestor. Você acompanha em "Minhas reservas".`,
        [{ text: 'OK', onPress: () => nav.goBack() }],
      );
    } catch (e: any) {
      Alert.alert('Não foi possível reservar', e.message ?? 'Erro.');
      setDia(null);
      load(); // o dia pode ter sido tomado enquanto a tela estava aberta
    } finally {
      setBusy(false);
    }
  };

  if (!id) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={styles.title}>{areaNome}</Text>
        <Text style={styles.sub}>
          Escolha o dia. A reserva vale para o dia todo.
          {cal?.area.max_days_ahead != null
            ? ` Disponível para até ${cal.area.max_days_ahead} dias à frente.`
            : ''}
        </Text>

        {erro ? (
          <Text style={styles.erro}>{erro}</Text>
        ) : !cal ? (
          <Text style={styles.empty}>Carregando calendário…</Text>
        ) : (
          <>
            <Legenda />
            <Calendario days={cal.days} selecionado={dia} onSelect={(d) => setDia(d.day)} />
          </>
        )}

        {dia && (
          <View style={styles.resumo}>
            <Text style={styles.resumoLabel}>Dia selecionado</Text>
            <Text style={styles.resumoDia}>{diaBR(dia)} · dia todo</Text>
          </View>
        )}

        <PrimaryButton
          label={busy ? 'Reservando…' : dia ? `Reservar ${diaBR(dia)}` : 'Escolha um dia'}
          onPress={reservar}
          loading={busy}
          disabled={!dia}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.sm },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 20 },
  empty: { color: colors.textSecondary, fontSize: typography.size.md },
  erro: { color: colors.error, fontSize: typography.size.md },
  resumo: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.accent, borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.lg },
  resumoLabel: { fontSize: typography.size.xs, color: colors.textSecondary, fontWeight: typography.weight.semibold },
  resumoDia: { fontSize: typography.size.lg, color: colors.text, fontWeight: typography.weight.bold, marginTop: 2 },
});
