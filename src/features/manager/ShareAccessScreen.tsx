import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, BackButton } from '../../components/ui';
import { QrImage } from './QrImage';
import type { ManagerStackParamList } from '../../navigation/types';
import { CondoDetail, getCondo, useManagerCondo } from './manager.api';
import { qrLink as linkFor } from '../../api/config';

type Props = NativeStackScreenProps<ManagerStackParamList, 'ShareAccess'>;

/** Compartilhar acesso (③·8) — QR/link da portaria + código do condomínio. */
export function ShareAccessScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const [detail, setDetail] = useState<CondoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const copiarCodigo = async (codigo: string) => {
    await Clipboard.setStringAsync(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000); // volta o rótulo após o feedback
  };

  useEffect(() => {
    if (!condo) return;
    getCondo(condo.condoId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [condo?.condoId]);

  const qrLink = detail?.qr_token ? linkFor(detail.qr_token) : null;

  const shareLink = async () => {
    if (!qrLink) return;
    // Compartilha só a URL — sem texto em volta, para colar limpo em qualquer app.
    await Share.share({ message: qrLink });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
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
            <View style={styles.qrBox}>
              {qrLink ? <QrImage value={qrLink} size={180} /> : null}
              <Text style={styles.qrHint}>QR da portaria</Text>
            </View>

            <Text style={styles.fieldLabel}>Link da portaria</Text>
            <View style={styles.linkRow}>
              <Text style={styles.link} numberOfLines={1}>{qrLink ?? '—'}</Text>
            </View>

            <PrimaryButton label="Compartilhar link" onPress={shareLink} disabled={!qrLink} />

            <View style={styles.codeCard}>
              <Text style={styles.fieldLabel}>Código do condomínio (para moradores entrarem)</Text>
              <View style={styles.codeRow}>
                <Text style={styles.code}>{detail?.join_code ?? '—'}</Text>
                {detail?.join_code && (
                  <Pressable
                    style={({ pressed }) => [styles.copyBtn, pressed && styles.copyBtnOn]}
                    onPress={() => copiarCodigo(detail.join_code)}
                    accessibilityLabel="Copiar código do condomínio"
                  >
                    <Text style={styles.copyText}>{copiado ? '✓ Copiado' : '⧉ Copiar'}</Text>
                  </Pressable>
                )}
              </View>
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
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  body: { padding: spacing.xl },
  qrBox: { alignSelf: 'center', alignItems: 'center', padding: spacing.lg, borderRadius: radii.card, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  qrHint: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: spacing.sm },
  fieldLabel: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: typography.weight.medium },
  linkRow: { backgroundColor: colors.card, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  link: { fontSize: typography.size.sm, color: colors.text },
  codeCard: { marginTop: spacing.xxl, backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, gap: spacing.md },
  code: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, letterSpacing: 3 },
  copyBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.errorBg },
  copyBtnOn: { opacity: 0.7 },
  copyText: { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
});
