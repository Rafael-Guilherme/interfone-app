import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { CommonArea, listAreas, updateArea, deleteArea, useManagerCondo } from './manager.api';
import { formatarReais } from '../../lib/mask';

/** Áreas comuns (③·6) — habilitar/desabilitar, ver agendamentos. */
export function CommonAreasScreen() {
  const condo = useManagerCondo();
  const nav = useNavigation<any>();
  const id = condo?.condoId;
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try { setAreas(await listAreas(id)); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (a: CommonArea) => { if (id) { await updateArea(id, a.id, { enabled: !a.enabled }); load(); } };
  const remove = (a: CommonArea) =>
    Alert.alert('Remover área', `Remover "${a.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { if (id) { await deleteArea(id, a.id); load(); } } },
    ]);

  if (!id) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Áreas comuns</Text>
        <Text style={styles.sub}>Habilite áreas para reserva e veja os agendamentos.</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            {areas.length === 0 && <Text style={styles.empty}>Nenhuma área cadastrada ainda.</Text>}
            {areas.map((a) => (
              <View key={a.id} style={styles.card}>
                <Pressable style={{ flex: 1 }} onPress={() => nav.navigate('AreaBookings', { areaId: a.id, areaName: a.name })}>
                  <Text style={styles.name}>{a.name}</Text>
                  <Text style={styles.meta}>
                    {[
                      a.capacity != null ? `${a.capacity} pessoas` : null,
                      a.fee_cents != null ? formatarReais(a.fee_cents) : null,
                      `${a.reservations} agendamento(s)`,
                    ].filter(Boolean).join(' · ')} ›
                  </Text>
                </Pressable>
                {/* Antes o editar era um "✎" cinza de 15px, quase invisível ao
                    lado do Switch. Agora é um botão com borda e rótulo. */}
                <Pressable
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${a.name}`}
                  onPress={() => nav.navigate('AreaForm', { area: { id: a.id, name: a.name, capacity: a.capacity, fee_cents: a.fee_cents, max_days_ahead: a.max_days_ahead } })}
                  style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnOn]}
                >
                  <Text style={styles.editText}>✎ Editar</Text>
                </Pressable>
                <Switch value={a.enabled} onValueChange={() => toggle(a)} trackColor={{ true: colors.accent }} />
                <Pressable hitSlop={8} accessibilityLabel={`Remover ${a.name}`} onPress={() => remove(a)}>
                  <Text style={styles.del}>✕</Text>
                </Pressable>
              </View>
            ))}

            <Pressable style={styles.add} onPress={() => nav.navigate('AreaForm')}>
              <Text style={styles.addText}>＋ Adicionar área comum</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  editBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  editBtnOn: { borderColor: colors.accent, backgroundColor: colors.errorBg },
  editText: { fontSize: typography.size.xs, color: colors.text, fontWeight: typography.weight.semibold },
  del: { fontSize: typography.size.md, color: colors.error },
  add: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginTop: spacing.sm },
  addText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
});
