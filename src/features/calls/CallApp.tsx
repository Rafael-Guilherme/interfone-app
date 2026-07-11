import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii } from '../../theme';
import { ScreenTitle } from '../../components/ui';
import { useSession } from '../../stores/session';
import { useCall } from '../../stores/call';
import { useResidentCall } from './useResidentCall';
import { IncomingCallScreen } from './IncomingCallScreen';
import { InCallScreen } from './InCallScreen';

/**
 * App autenticado do morador: monta a ponte de chamada e roteia pela fase do
 * store (idle → incoming → connecting/inCall → ended). É montado quando o
 * usuário tem um perfil ATIVO (ver RootNavigator).
 */
export function CallApp() {
  const phase = useCall((s) => s.phase);
  const reset = useCall((s) => s.reset);
  const { answer, decline, end } = useResidentCall();

  useEffect(() => {
    if (phase === 'ended') {
      const t = setTimeout(reset, 1400);
      return () => clearTimeout(t);
    }
  }, [phase, reset]);

  if (phase === 'incoming') {
    return <IncomingCallScreen onAccept={() => answer()} onDecline={() => decline()} />;
  }
  if (phase === 'connecting' || phase === 'inCall') {
    return <InCallScreen onEnd={async () => end()} />;
  }
  if (phase === 'ended') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.endedText}>Chamada encerrada</Text>
      </SafeAreaView>
    );
  }
  return <HomeIdle />;
}

/** Início (②·1, simplificado): mostra a unidade e aguarda a portaria chamar. */
function HomeIdle() {
  const user = useSession((s) => s.user);
  const profiles = useSession((s) => s.profiles);
  const signOut = useSession((s) => s.signOut);
  const active = profiles.find((p) => p.status === 'active') ?? profiles[0];
  const unit = active?.units[0];
  const condo = active?.condominium.name;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <ScreenTitle
          title={`Olá, ${user?.name?.split(' ')[0] ?? 'morador'}`}
          subtitle={unit ? `${condo} · ${unit.label}` : condo}
        />
        <View style={styles.waitCard}>
          <View style={styles.dot} />
          <Text style={styles.waitTitle}>Aguardando chamadas</Text>
          <Text style={styles.waitSub}>
            Quando a portaria (web do entregador) chamar sua unidade, a chamada aparece aqui.
          </Text>
        </View>
        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingTop: spacing.xl, flexGrow: 1 },
  waitCard: { backgroundColor: colors.card, borderRadius: radii.card, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  dot: { width: 14, height: 14, borderRadius: 999, backgroundColor: colors.success, marginBottom: spacing.lg },
  waitTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.sm },
  waitSub: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  signOut: { marginTop: spacing.xl, alignItems: 'center' },
  signOutText: { color: colors.textSecondary, fontSize: typography.size.sm },
  endedText: { fontSize: typography.size.lg, color: colors.textSecondary },
});
