import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../components/ui';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';

/** Adicionar interfone: pergunta de novo se é morador ou gestor deste novo. */
export function AddRoleScreen() {
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.screen}>
      <BackButton onPress={() => nav.goBack()} />
      <Text style={styles.title}>Neste interfone, você é?</Text>
      <Text style={styles.sub}>Escolha seu papel neste condomínio.</Text>

      <Card emoji="🏠" title="Morador" desc="Moro aqui e quero receber chamadas. Vou entrar com o código do condomínio." onPress={() => nav.navigate('JoinUnit')} />
      <Card emoji="🔑" title="Gestor" desc="Vou gerenciar um interfone: entrar num existente pelo código ou criar um novo." onPress={() => nav.navigate('SindicoStart')} />
    </SafeAreaView>
  );
}

function Card({ emoji, title, desc, onPress }: { emoji: string; title: string; desc: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, gap: spacing.lg },
  cardPressed: { borderColor: colors.text },
  emoji: { fontSize: 30 },
  cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  cardDesc: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  chevron: { fontSize: 28, color: colors.textMuted },
});
