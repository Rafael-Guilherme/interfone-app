import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field, ScreenTitle } from '../../components/ui';
import { api } from '../../api';
import { useSession } from '../../stores/session';
import type { Me } from '../../types';

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://interfone.app/termos';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://interfone.app/privacidade';

/**
 * Finaliza o cadastro do usuário (novo síndico) após criar o interfone:
 * nome + telefone + aceite dos Termos de Uso e Política de Privacidade.
 */
export function FinishAccountScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const sessionUser = useSession((s) => s.user);
  const setMe = useSession((s) => s.setMe);

  const [name, setName] = useState(sessionUser?.name && sessionUser.name !== 'Morador' ? sessionUser.name : '');
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    try {
      const me = await api.patch<Me>('/me', { name: name.trim(), phone: phone.trim() || undefined });
      setMe(me);
      nav.replace('RegisterSuccess', {
        condoName: route.params?.condoName,
        joinCode: route.params?.joinCode,
        qrToken: route.params?.qrToken,
      });
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao finalizar cadastro.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <ScreenTitle title="Finalizar cadastro" subtitle="Só faltam seus dados para concluir." />

        <Field label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" />
        <Field label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+55 11 90000-0000" />

        <Pressable style={styles.terms} onPress={() => setAccepted((v) => !v)}>
          <View style={[styles.box, accepted && styles.boxOn]}>{accepted && <Text style={styles.check}>✓</Text>}</View>
          <Text style={styles.termsText}>
            Li e aceito os{' '}
            <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>Termos de Uso</Text>
            {' '}e a{' '}
            <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>Política de Privacidade</Text>.
          </Text>
        </Pressable>

        <View style={{ height: spacing.md }} />
        <PrimaryButton
          label={busy ? 'Concluindo…' : 'Concluir cadastro'}
          onPress={finish}
          loading={busy}
          disabled={name.trim().length < 2 || !accepted}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingTop: spacing.xxl },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.md },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.textOnAccent, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  termsText: { flex: 1, fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 20 },
  link: { color: colors.accent, textDecorationLine: 'underline', fontWeight: typography.weight.medium },
});
