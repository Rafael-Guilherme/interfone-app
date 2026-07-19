import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field } from '../../components/ui';
import { LookupResult, lookupByCode, join } from './manager.api';

/** Morador entra num interfone pelo código do condomínio + escolhe a unidade. */
export function JoinUnitScreen() {
  const navigation = useNavigation<any>();
  const [code, setCode] = useState('');
  const [found, setFound] = useState<LookupResult | null>(null);
  const [unitId, setUnitId] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    setBusy(true);
    try {
      const r = await lookupByCode(code.trim().toUpperCase());
      setFound(r);
      setUnitId(r.units[0]?.id ?? '');
    } catch (e: any) {
      Alert.alert('Código', e.message ?? 'Condomínio não encontrado.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!found || !unitId) return;
    setBusy(true);
    try {
      await join(found.id, unitId);
      Alert.alert('Solicitação enviada', 'Aguarde o síndico aprovar sua entrada na unidade.', [
        { text: 'OK', onPress: () => navigation.navigate('InterfoneSelect') },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao entrar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Entrar como morador</Text>
        <Text style={styles.sub}>Digite o código do condomínio (o síndico compartilha).</Text>

        <Field label="Código do condomínio" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="Ex.: DEMO123" maxLength={8} />
        {!found ? (
          <PrimaryButton label={busy ? 'Buscando…' : 'Buscar'} onPress={lookup} loading={busy} disabled={code.length < 4} />
        ) : (
          <>
            <Text style={styles.found}>{found.name}</Text>
            <Text style={styles.label}>Sua unidade</Text>
            <View style={styles.units}>
              {found.units.map((u) => (
                <Pressable key={u.id} onPress={() => setUnitId(u.id)} style={[styles.unit, unitId === u.id && styles.unitOn]}>
                  <Text style={[styles.unitText, unitId === u.id && styles.unitTextOn]}>{u.label}</Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton label={busy ? 'Enviando…' : 'Entrar nesta unidade'} onPress={confirm} loading={busy} disabled={!unitId} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingTop: spacing.xxl },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.lg },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  found: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginVertical: spacing.md },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: typography.weight.medium },
  units: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  unit: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  unitOn: { borderColor: colors.text, backgroundColor: colors.text },
  unitText: { color: colors.text, fontSize: typography.size.sm },
  unitTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
});
