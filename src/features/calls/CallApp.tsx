import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../theme';
import { useCall } from '../../stores/call';
import { useResidentCall } from './useResidentCall';
import { IncomingCallScreen } from './IncomingCallScreen';
import { InCallScreen } from './InCallScreen';
import { ResidentNavigator } from '../../navigation/ResidentNavigator';

/**
 * App do morador. Monta a ponte de chamada (socket) e, quando NÃO há chamada,
 * mostra as abas do morador. Uma chamada recebida assume a tela inteira (overlay)
 * — ao encerrar, volta às abas.
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

  if (phase === 'incoming') return <IncomingCallScreen onAccept={() => answer()} onDecline={() => decline()} />;
  if (phase === 'connecting' || phase === 'inCall') return <InCallScreen onEnd={async () => end()} />;
  if (phase === 'ended') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.endedText}>Chamada encerrada</Text>
      </SafeAreaView>
    );
  }
  return <ResidentNavigator />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  endedText: { fontSize: typography.size.lg, color: colors.textSecondary },
});
