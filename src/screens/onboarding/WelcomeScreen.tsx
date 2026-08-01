import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton } from '../../components/ui';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const DESTAQUES = [
  { icone: '📞', texto: 'Atenda a portaria pelo celular, onde estiver' },
  { icone: '📦', texto: 'Receba entregadores e visitantes por vídeo' },
  { icone: '🏢', texto: 'Gestão do condomínio na palma da mão' },
];

/** Boas-vindas (①·1) — entrada da marca, CTA "Começar" + link "Entrar". */
export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image source={require('../../../assets/icon.png')} style={styles.logo} accessibilityLabel="Interfone" />
        <Text style={styles.brand}>Interfone</Text>
        <Text style={styles.tagline}>A portaria do seu condomínio, agora no seu celular.</Text>

        <View style={styles.destaques}>
          {DESTAQUES.map((d) => (
            <View key={d.texto} style={styles.destaque}>
              <View style={styles.destaqueIcone}>
                <Text style={styles.destaqueEmoji}>{d.icone}</Text>
              </View>
              <Text style={styles.destaqueTexto}>{d.texto}</Text>
            </View>
          ))}
        </View>
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
  hero: { flex: 1, justifyContent: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radii.card,
    // O PNG é "full-bleed" (vermelho até a borda); overflow garante o corte
    // arredondado no Android, que não recorta a imagem só com borderRadius.
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  brand: { fontSize: 40, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.sm, letterSpacing: -0.5 },
  tagline: { fontSize: typography.size.lg, color: colors.textSecondary, lineHeight: 26, marginBottom: spacing.xxl },
  destaques: { gap: spacing.lg },
  destaque: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  destaqueIcone: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destaqueEmoji: { fontSize: typography.size.lg },
  destaqueTexto: { flex: 1, fontSize: typography.size.md, color: colors.text, lineHeight: 20 },
  actions: { paddingBottom: spacing.lg },
  secondary: { alignItems: 'center', paddingVertical: spacing.lg },
  secondaryText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
});
