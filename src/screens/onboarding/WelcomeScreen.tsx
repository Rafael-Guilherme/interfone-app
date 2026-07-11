import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton } from '../../components/ui';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

/** Boas-vindas (①·1) — splash/entrada, CTA "Começar" + link "Entrar". */
export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.logoDot} />
        <Text style={styles.brand}>Interfone</Text>
        <Text style={styles.tagline}>
          A portaria do seu condomínio no celular — receba chamadas de moradores e
          entregadores onde estiver.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Começar" onPress={() => navigation.navigate('RoleSelect')} />
        <Pressable style={styles.secondary} onPress={() => navigation.navigate('Auth', { intent: 'login' })}>
          <Text style={styles.secondaryText}>Já tenho conta · Entrar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  logoDot: { width: 40, height: 40, borderRadius: radii.card, backgroundColor: colors.accent, marginBottom: spacing.xl },
  brand: { fontSize: 40, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.md },
  tagline: { fontSize: typography.size.md, color: colors.textSecondary, lineHeight: 24 },
  actions: { paddingBottom: spacing.lg },
  secondary: { alignItems: 'center', paddingVertical: spacing.lg },
  secondaryText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
});
