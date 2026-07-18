import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme';
import { PrimaryButton, Field } from '../../components/ui';
import { createArea, updateArea, useManagerCondo } from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'AreaForm'>;

/** Criar/editar área comum — nome + capacidade e taxa (opcionais). */
export function AreaFormScreen({ route, navigation }: Props) {
  const area = route.params?.area;
  const condo = useManagerCondo();
  const [name, setName] = useState(area?.name ?? '');
  const [capacity, setCapacity] = useState(area?.capacity != null ? String(area.capacity) : '');
  const [fee, setFee] = useState(area?.fee_cents != null ? (area.fee_cents / 100).toFixed(2) : '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!condo) return;
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        capacity: capacity.trim() ? parseInt(capacity, 10) : null,
        fee_cents: fee.trim() ? Math.round(parseFloat(fee.replace(',', '.')) * 100) : null,
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
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>{area ? 'Editar área' : 'Nova área comum'}</Text>

        <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Salão de festas" />
        <Field label="Capacidade (opcional)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="Ex.: 30 pessoas" />
        <Field label="Taxa de uso (opcional)" value={fee} onChangeText={setFee} keyboardType="decimal-pad" placeholder="Ex.: 50,00" />
        <Text style={styles.hint}>Deixe capacidade e taxa em branco se não se aplicarem.</Text>

        <View style={{ height: spacing.lg }} />
        <PrimaryButton label={busy ? 'Salvando…' : area ? 'Salvar' : 'Adicionar área'} onPress={save} loading={busy} disabled={name.trim().length < 2} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.md },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  hint: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: -spacing.sm },
});
