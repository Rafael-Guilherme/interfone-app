import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field, BackButton } from '../../components/ui';
import { lookupByCode, joinAsManager } from './manager.api';
import { useSession } from '../../stores/session';

/**
 * Início do gestor: entrar num interfone existente pelo código (como gestor)
 * ou criar um novo interfone.
 */
export function SindicoStartScreen() {
  const nav = useNavigation<any>();
  const isNewUser = useSession((s) => s.profiles.length === 0);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const joinExisting = async () => {
    setBusy(true);
    try {
      const found = await lookupByCode(code.trim().toUpperCase());
      // Usuário novo: coleta foto/nome/telefone antes de pedir acesso.
      if (isNewUser) {
        nav.navigate('CompleteProfile', { kind: 'manager', condoId: found.id, condoName: found.name });
        return;
      }
      await joinAsManager(found.id);
      Alert.alert('Solicitação enviada', `Você pediu acesso como gestor de "${found.name}". Aguarde a autorização.`, [
        { text: 'OK', onPress: () => nav.navigate('InterfoneSelect') },
      ]);
    } catch (e: any) {
      Alert.alert('Código', e.message ?? 'Condomínio não encontrado.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <BackButton onPress={() => nav.goBack()} />
        <Text style={styles.title}>Interfone do gestor</Text>
        <Text style={styles.sub}>Já tem o código de um interfone existente? Entre como gestor. Senão, crie um novo.</Text>

        <Field label="Código do condomínio" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="Ex.: DEMO123" maxLength={8} />
        <PrimaryButton label={busy ? 'Enviando…' : 'Entrar como gestor'} onPress={joinExisting} loading={busy} disabled={code.trim().length < 4} />

        <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>ou</Text><View style={styles.line} /></View>

        <Pressable style={styles.create} onPress={() => nav.navigate('ManagerRegister')}>
          <Text style={styles.createTitle}>Criar um novo interfone</Text>
          <Text style={styles.createDesc}>Cadastre seu condomínio do zero (foto, endereço, blocos, unidades, raio).</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl, lineHeight: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textMuted, fontSize: typography.size.sm },
  create: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  createTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  createDesc: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
