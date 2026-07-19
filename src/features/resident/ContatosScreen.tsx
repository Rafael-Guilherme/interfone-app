import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { BackButton } from '../../components/ui';
import { Contato, getContatos, useResidentCondo } from './resident.api';

/**
 * Comunicação interna do morador (②·4 / DEFM·4): contatos do condomínio
 * cadastrados pelo gestor (portaria, zelador, administração). Toca para ligar.
 */
export function ContatosScreen() {
  const nav = useNavigation<any>();
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [itens, setItens] = useState<Contato[]>([]);
  const [carregando, setCarregando] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try { setItens(await getContatos(id)); } finally { setCarregando(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const ligar = async (c: Contato) => {
    const url = `tel:${c.phone.replace(/[^\d+*#]/g, '')}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert('Não foi possível ligar', `Ligue para ${c.phone}.`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={styles.title}>Contatos do condomínio</Text>
        <Text style={styles.sub}>Portaria, zeladoria e administração. Toque para ligar.</Text>

        {carregando ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : itens.length === 0 ? (
          <Text style={styles.empty}>Nenhum contato cadastrado pelo gestor ainda.</Text>
        ) : (
          itens.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => ligar(c)}
              accessibilityRole="button"
              accessibilityLabel={`Ligar para ${c.name}`}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.icone}>
                <Text style={styles.iconeText}>☎</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{c.name}</Text>
                <Text style={styles.fone}>
                  {c.phone}
                  {c.note ? ` · ${c.note}` : ''}
                </Text>
              </View>
              <Text style={styles.ligar}>Ligar</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.sm },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  cardPressed: { borderColor: colors.accent, backgroundColor: colors.bg },
  icone: { width: 42, height: 42, borderRadius: 999, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center' },
  iconeText: { fontSize: typography.size.lg, color: colors.accent },
  nome: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  fone: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  ligar: { fontSize: typography.size.sm, color: colors.accent, fontWeight: typography.weight.semibold },
});
