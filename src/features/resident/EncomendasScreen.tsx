import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { MyPackage, getMyPackages, pickupMyPackage, useResidentCondo } from './resident.api';

const quando = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Encomendas do morador — o que a portaria registrou para a unidade dele. */
export function EncomendasScreen() {
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [items, setItems] = useState<MyPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setItems(await getMyPackages(id));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmar = (p: MyPackage) =>
    Alert.alert('Confirmar retirada', `Você já retirou "${p.descricao}" na portaria?`, [
      { text: 'Ainda não', style: 'cancel' },
      { text: 'Já retirei', onPress: async () => { if (id) { await pickupMyPackage(id, p.id); load(); } } },
    ]);

  const aguardando = items.filter((p) => p.status === 'waiting');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Encomendas</Text>
        <Text style={styles.sub}>
          {aguardando.length > 0
            ? `${aguardando.length} aguardando retirada na portaria`
            : 'Nada aguardando na portaria'}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>Nenhuma encomenda registrada para a sua unidade.</Text>
        ) : (
          items.map((p) => {
            const aguardando = p.status === 'waiting';
            // O cartão inteiro abre a confirmação: antes só o texto "Já
            // retirei" era tocável, e nada indicava que o resto respondia.
            return (
              <Pressable
                key={p.id}
                onPress={aguardando ? () => confirmar(p) : undefined}
                disabled={!aguardando}
                accessibilityRole={aguardando ? 'button' : undefined}
                accessibilityLabel={aguardando ? `Confirmar retirada de ${p.descricao}` : undefined}
                style={({ pressed }) => [
                  styles.card,
                  !aguardando && styles.cardOff,
                  aguardando && styles.cardAtivo,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.icon, aguardando && styles.iconAtivo]}>
                  <Text style={styles.iconText}>{aguardando ? '📦' : '✓'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.descricao}</Text>
                  {p.destinatario ? <Text style={styles.dest}>para {p.destinatario}</Text> : null}
                  <Text style={styles.meta}>
                    {p.transportadora ? `${p.transportadora} · ` : ''}chegou em {quando(p.recebida_em)}
                  </Text>
                  {aguardando ? (
                    <View style={styles.actBtn}>
                      <Text style={styles.actBtnText}>Confirmar retirada</Text>
                    </View>
                  ) : (
                    <Text style={styles.retirada}>
                      retirada em {p.retirada_em ? quando(p.retirada_em) : '—'}
                    </Text>
                  )}
                </View>
                {aguardando && <Text style={styles.chevron}>›</Text>}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  cardOff: { opacity: 0.6 },
  // Aguardando retirada: borda de destaque + sombra leve, para o cartão ler
  // como algo acionável e não como um item de lista estático.
  cardAtivo: {
    borderColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: { backgroundColor: colors.bg },
  icon: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  iconAtivo: { backgroundColor: colors.errorBg, borderColor: colors.accent },
  iconText: { fontSize: typography.size.lg, color: colors.text },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  dest: { fontSize: typography.size.sm, color: colors.text, marginTop: 1 },
  meta: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  retirada: { fontSize: typography.size.xs, color: colors.success, marginTop: 4 },
  actBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  actBtnText: { color: colors.textOnAccent, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  chevron: { fontSize: 26, lineHeight: 28, color: colors.textMuted, alignSelf: 'center' },
});
