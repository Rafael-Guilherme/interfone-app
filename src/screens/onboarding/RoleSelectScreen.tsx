import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { ScreenTitle } from '../../components/ui';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'RoleSelect'>;

/** "Você é?" — escolhe morador ou síndico, decidindo a jornada. */
export function RoleSelectScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <BackLink onPress={() => navigation.goBack()} />
      <ScreenTitle title="Você é?" subtitle="Escolha como quer usar o Interfone." />

      <RoleCard
        emoji="🏠"
        title="Morador"
        desc="Recebo chamadas da portaria e de visitantes na minha unidade."
        onPress={() => navigation.navigate('Auth', { intent: 'resident' })}
      />
      <RoleCard
        emoji="🔑"
        title="Síndico"
        desc="Quero cadastrar o interfone do meu condomínio e gerenciá-lo."
        onPress={() => navigation.navigate('Auth', { intent: 'manager' })}
      />
    </SafeAreaView>
  );
}

function RoleCard({ emoji, title, desc, onPress }: { emoji: string; title: string; desc: string; onPress: () => void }) {
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

export function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back} hitSlop={12}>
      <Text style={styles.backText}>‹ Voltar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  back: { marginBottom: spacing.md },
  backText: { color: colors.textSecondary, fontSize: typography.size.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  cardPressed: { borderColor: colors.text },
  emoji: { fontSize: 30 },
  cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  cardDesc: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  chevron: { fontSize: 28, color: colors.textMuted },
});
