import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { BackButton } from '../../components/ui';

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

/**
 * Comunicado em tela cheia. Antes o aviso só expandia dentro do cartão da
 * lista, com corpo em 13px cinza — ruim para ler um texto longo do gestor.
 */
export function ComunicadoDetalheScreen() {
  const nav = useNavigation<any>();
  const { comunicado } = useRoute<any>().params ?? {};
  if (!comunicado) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <BackButton label="Comunicados" onPress={() => nav.goBack()} />
        <Text style={styles.data}>{quando(comunicado.created_at)}</Text>
        <Text style={styles.titulo}>{comunicado.title}</Text>
        <Text style={styles.corpo}>{comunicado.body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxl },
  data: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    fontWeight: typography.weight.semibold,
  },
  titulo: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 32,
  },
  // Corpo em tamanho de leitura, não em tamanho de metadado.
  corpo: { fontSize: typography.size.md, color: colors.text, lineHeight: 26 },
});
