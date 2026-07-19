import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme';
import { PrimaryButton, Field, BackButton } from '../../components/ui';
import { centavosParaTexto, textoParaCentavos } from '../../lib/mask';
import { createArea, updateArea, useManagerCondo } from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'AreaForm'>;

/** Criar/editar área comum — nome, capacidade, taxa e janela de agendamento. */
export function AreaFormScreen({ route, navigation }: Props) {
  const area = route.params?.area;
  const condo = useManagerCondo();
  const [name, setName] = useState(area?.name ?? '');
  const [capacity, setCapacity] = useState(area?.capacity != null ? String(area.capacity) : '');
  // Guardado em centavos; o campo mostra o texto mascarado.
  const [feeCents, setFeeCents] = useState(area?.fee_cents ?? 0);
  const [diasAntes, setDiasAntes] = useState(
    area?.max_days_ahead != null ? String(area.max_days_ahead) : '',
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!condo) return;
    const dias = diasAntes.trim() ? parseInt(diasAntes, 10) : null;
    if (dias != null && (Number.isNaN(dias) || dias < 1 || dias > 365)) {
      Alert.alert('Antecedência inválida', 'Informe de 1 a 365 dias, ou deixe em branco para sem limite.');
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        capacity: capacity.trim() ? parseInt(capacity, 10) : null,
        fee_cents: feeCents > 0 ? feeCents : null,
        max_days_ahead: dias,
      };
      if (area) await updateArea(condo.condoId, area.id, body);
      else await createArea(condo.condoId, body);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao salvar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{area ? 'Editar área' : 'Nova área comum'}</Text>

        <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Salão de festas" />
        <Field
          label="Capacidade (opcional)"
          value={capacity}
          onChangeText={(t) => setCapacity(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder="Ex.: 30"
        />

        {/* O "R$" fica fixo fora do campo: o usuário digita só os números. */}
        <Text style={styles.label}>Taxa de uso (opcional)</Text>
        <View style={styles.moneyRow}>
          <Text style={styles.moneyPrefix}>R$</Text>
          <Field
            value={centavosParaTexto(feeCents)}
            onChangeText={(t) => setFeeCents(textoParaCentavos(t))}
            keyboardType="number-pad"
            containerStyle={styles.moneyInput}
          />
        </View>

        <Field
          label="Reservar com até quantos dias de antecedência?"
          value={diasAntes}
          onChangeText={(t) => setDiasAntes(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder="Ex.: 30"
        />
        <Text style={styles.hint}>
          Em branco = sem limite. Com 30, o morador só enxerga os próximos 30 dias no calendário.
        </Text>

        <View style={{ height: spacing.lg }} />
        <PrimaryButton
          label={busy ? 'Salvando…' : area ? 'Salvar' : 'Adicionar área'}
          onPress={save}
          loading={busy}
          disabled={name.trim().length < 2}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.lg },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: typography.weight.medium },
  moneyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  moneyPrefix: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    height: 50,
    lineHeight: 50,
  },
  moneyInput: { flex: 1 },
  hint: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: -spacing.sm, lineHeight: 17 },
});
