import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { useSession } from '../../stores/session';
import { api } from '../../api';
import type { Me } from '../../types';

/**
 * Fim do cadastro do gestor: interfone criado, aguardando autorização do
 * administrador (o Profile do gestor fica `pending` até um super-admin aprovar).
 */
export function RegisterSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { condoName, joinCode } = route.params ?? {};
  const setMe = useSession((s) => s.setMe);
  const [checking, setChecking] = useState(false);

  // Rebusca o /me; quando o admin autorizar (perfil ativo), o interfone aparece
  // disponível no seletor. Aqui só atualiza e avisa se ainda está pendente.
  const refresh = async () => {
    setChecking(true);
    try {
      const me = await api.get<Me>('/me');
      setMe(me);
      if (me.profiles.some((p) => p.status === 'active')) {
        navigation.navigate('InterfoneSelect');
      } else {
        Alert.alert('Ainda em análise', 'O interfone ainda aguarda autorização do administrador.');
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao atualizar status.');
    } finally {
      setChecking(false);
    }
  };

  // Volta ao seletor de interfones (usuário continua logado).
  const onExit = () => navigation.navigate('InterfoneSelect');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.title}>Interfone cadastrado!</Text>
        <Text style={styles.sub}>
          <Text style={styles.strong}>{condoName}</Text> foi enviado para análise.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aguardando autorização</Text>
          <Text style={styles.cardText}>
            O acesso ao interfone será liberado assim que o administrador autorizar o cadastro.
            Você será avisado quando estiver ativo.
          </Text>
          {joinCode ? (
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Código do condomínio</Text>
              <Text style={styles.code}>{joinCode}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.refresh} onPress={refresh} disabled={checking}>
          <Text style={styles.refreshText}>{checking ? 'Verificando…' : 'Atualizar status'}</Text>
        </Pressable>
        <Pressable style={styles.signOut} onPress={onExit}>
          <Text style={styles.signOutText}>Voltar ao início</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  check: { width: 72, height: 72, borderRadius: 999, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  checkMark: { fontSize: 36, color: colors.success, fontWeight: typography.weight.bold },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.sm },
  sub: { fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  strong: { color: colors.text, fontWeight: typography.weight.semibold },
  card: { width: '100%', backgroundColor: colors.card, borderRadius: radii.card, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.warning, marginBottom: spacing.sm },
  cardText: { fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 20 },
  codeRow: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  codeLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginBottom: 2 },
  code: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text, letterSpacing: 2 },
  footer: {},
  refresh: { height: 52, borderRadius: radii.button, borderWidth: 1, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.semibold },
  signOut: { alignItems: 'center', paddingVertical: spacing.lg },
  signOutText: { color: colors.textSecondary, fontSize: typography.size.md },
});
