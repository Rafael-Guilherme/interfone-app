import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton } from '../../components/ui';
import type { ManagerStackParamList } from '../../navigation/types';
import { CondoDetail, getCondo, useManagerCondo } from './manager.api';

type Props = NativeStackScreenProps<ManagerStackParamList, 'ShareAccess'>;

// Base da web do entregador (o entregador abre esse link, que lê ?t=<token>).
const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173').replace(/\/$/, '');

/** Compartilhar acesso (③·8) — QR/link da portaria + código do condomínio. */
export function ShareAccessScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const [detail, setDetail] = useState<CondoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condo) return;
    getCondo(condo.condoId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [condo?.condoId]);

  const qrLink = detail?.qr_token ? `${WEB_URL}/?t=${detail.qr_token}` : null;

  const shareLink = async () => {
    if (!qrLink) return;
    await Share.share({
      message: `Chame a portaria do ${detail?.name} pelo Interfone: ${qrLink}`,
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Compartilhar acesso</Text>
        <Text style={styles.sub}>
          Entregadores e visitantes usam este link/QR para chamar a portaria pela web — sem instalar app.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            {/* Placeholder do QR (imagem do QR entra com react-native-qrcode-svg). */}
            <View style={styles.qrBox}>
              <Text style={styles.qrGlyph}>▦</Text>
              <Text style={styles.qrHint}>QR da portaria</Text>
            </View>

            <Text style={styles.fieldLabel}>Link da portaria</Text>
            <View style={styles.linkRow}>
              <Text style={styles.link} numberOfLines={1}>{qrLink ?? '—'}</Text>
            </View>

            <PrimaryButton label="Compartilhar link" onPress={shareLink} disabled={!qrLink} />

            <View style={styles.codeCard}>
              <Text style={styles.fieldLabel}>Código do condomínio (para moradores entrarem)</Text>
              <Text style={styles.code}>{detail?.join_code ?? '—'}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.sm },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  body: { padding: spacing.xl },
  qrBox: { alignSelf: 'center', width: 200, height: 200, borderRadius: radii.card, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  qrGlyph: { fontSize: 96, color: colors.text },
  qrHint: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: spacing.sm },
  fieldLabel: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: typography.weight.medium },
  linkRow: { backgroundColor: colors.card, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  link: { fontSize: typography.size.sm, color: colors.text },
  codeCard: { marginTop: spacing.xxl, backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  code: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, letterSpacing: 3, marginTop: spacing.xs },
});
