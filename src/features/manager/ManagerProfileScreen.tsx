import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field } from '../../components/ui';
import { api } from '../../api';
import { useSession } from '../../stores/session';
import type { Me } from '../../types';

/** Perfil do síndico (③·8-ish) — foto, nome, telefone. */
export function ManagerProfileScreen() {
  const setMe = useSession((s) => s.setMe);
  const signOut = useSession((s) => s.signOut);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/me').then((me) => {
      setEmail(me.user.email);
      setName(me.user.name ?? '');
      setPhone(me.user.phone ?? '');
      setAvatar(me.user.avatar_url ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const pick = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, base64: true, allowsEditing: true, aspect: [1, 1] });
    if (!r.canceled && r.assets[0]?.base64) setAvatar(`data:image/jpeg;base64,${r.assets[0].base64}`);
  };

  const save = async () => {
    setBusy(true);
    try {
      const me = await api.patch<Me>('/me', { name, phone, avatar_url: avatar ?? undefined });
      setMe(me);
      Alert.alert('Salvo', 'Perfil atualizado.');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao salvar.');
    } finally { setBusy(false); }
  };

  if (loading) return <SafeAreaView style={styles.screen} edges={['top']} />;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Perfil</Text>

        <Pressable style={styles.avatarWrap} onPress={pick}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : (
            <View style={[styles.avatar, styles.avatarEmpty]}><Text style={styles.avatarLetter}>{(name || email || '?').charAt(0).toUpperCase()}</Text></View>
          )}
          <Text style={styles.changePhoto}>Trocar foto</Text>
        </Pressable>

        <Field label="Nome" value={name} onChangeText={setName} />
        <Field label="E-mail" value={email} editable={false} />
        <Field label="Telefone (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+55 11 90000-0000" />

        <View style={{ height: spacing.md }} />
        <PrimaryButton label={busy ? 'Salvando…' : 'Salvar'} onPress={save} loading={busy} />

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.xl },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 96, height: 96, borderRadius: 999 },
  avatarEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 40, fontWeight: typography.weight.bold, color: colors.text },
  changePhoto: { color: colors.accent, fontSize: typography.size.sm, marginTop: spacing.sm, fontWeight: typography.weight.medium },
  signOut: { alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.md },
  signOutText: { color: colors.error, fontSize: typography.size.md },
});
