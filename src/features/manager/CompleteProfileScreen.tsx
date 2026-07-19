import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field, ScreenHeader } from '../../components/ui';
import { mascaraTelefone } from '../../lib/mask';
import { api } from '../../api';
import { useSession } from '../../stores/session';
import { join, joinAsManager } from './manager.api';
import type { Me } from '../../types';

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://interfone.app/termos';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://interfone.app/privacidade';

/**
 * Coleta foto (opcional) + nome + telefone antes de o usuário NOVO entrar num
 * condomínio — morador ou gestor de um interfone existente. Atualiza o perfil
 * (`PATCH /me`), executa o join pendente e leva ao seletor.
 *
 * Params: { kind: 'resident' | 'manager', condoId, condoName, unitId? }.
 * `unitId` só para morador. Usuário novo (sem perfis) também aceita os termos.
 */
export function CompleteProfileScreen() {
  const nav = useNavigation<any>();
  const { kind, condoId, condoName, unitId } = useRoute<any>().params ?? {};
  const sessionUser = useSession((s) => s.user);
  const isNewUser = useSession((s) => s.profiles.length === 0);
  const setMe = useSession((s) => s.setMe);

  const nomeInicial = sessionUser?.name && sessionUser.name !== 'Morador' ? sessionUser.name : '';
  const [photo, setPhoto] = useState<string | null>(sessionUser?.avatar_url ?? null);
  const [name, setName] = useState(nomeInicial);
  const [phone, setPhone] = useState(mascaraTelefone(''));
  const [accepted, setAccepted] = useState(!isNewUser); // usuário já existente não repete os termos
  const [busy, setBusy] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permissão negada', 'Autorize o acesso às fotos.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets[0]?.base64) {
      setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const concluir = async () => {
    setBusy(true);
    try {
      // 1) salva os dados do usuário
      const me = await api.patch<Me>('/me', {
        name: name.trim(),
        phone: phone.trim() || undefined,
        avatar_url: photo ?? undefined,
      });
      setMe(me);

      // 2) executa o join pendente
      if (kind === 'manager') await joinAsManager(condoId);
      else await join(condoId, unitId);

      // 3) o perfil nasce pendente — o seletor mostra o badge e a checagem
      Alert.alert(
        'Solicitação enviada',
        kind === 'manager'
          ? `Você pediu acesso como gestor de "${condoName}". Aguarde a autorização.`
          : 'Aguarde o gestor aprovar sua entrada na unidade.',
        [{ text: 'OK', onPress: () => nav.navigate('InterfoneSelect') }],
      );
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  const inicial = (name.trim() || sessionUser?.email || '?').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Seus dados"
          subtitle={`Falta pouco para entrar em ${condoName ?? 'seu interfone'}.`}
          onBack={() => nav.goBack()}
        />

        {/* Foto opcional, redonda como avatar. */}
        <View style={styles.avatarWrap}>
          <Pressable style={styles.avatar} onPress={pickPhoto}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInicial}>{inicial}</Text>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>{photo ? '✎' : '＋'}</Text>
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Foto (opcional)</Text>
        </View>

        <Field label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" />
        <Field
          label="Telefone"
          value={phone}
          onChangeText={(t) => setPhone(mascaraTelefone(t))}
          keyboardType="phone-pad"
          placeholder="(11) 90000-0000"
        />

        {isNewUser && (
          <Pressable style={styles.terms} onPress={() => setAccepted((v) => !v)}>
            <View style={[styles.box, accepted && styles.boxOn]}>{accepted && <Text style={styles.check}>✓</Text>}</View>
            <Text style={styles.termsText}>
              Li e aceito os{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>Termos de Uso</Text>
              {' '}e a{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>Política de Privacidade</Text>.
            </Text>
          </Pressable>
        )}

        <View style={{ height: spacing.lg }} />
        <PrimaryButton
          label={busy ? 'Enviando…' : 'Concluir e entrar'}
          onPress={concluir}
          loading={busy}
          disabled={name.trim().length < 2 || !accepted}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 96, height: 96, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 96, height: 96, borderRadius: 999 },
  avatarInicial: { fontSize: 36, fontWeight: typography.weight.bold, color: colors.textSecondary },
  avatarBadge: { position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  avatarBadgeText: { color: colors.textOnAccent, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  avatarHint: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.sm },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.md },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.textOnAccent, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  termsText: { flex: 1, fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 20 },
  link: { color: colors.accent, textDecorationLine: 'underline', fontWeight: typography.weight.medium },
});
