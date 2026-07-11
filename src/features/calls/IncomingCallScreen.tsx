/**
 * Chamada recebida (②·2) — full-screen, não-descartável. Aceitar / recusar.
 * Tela pura dirigida pelo store; a rede é injetada pelo container via callbacks.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../theme';
import { useCall } from '../../stores/call';

interface Props {
  onAccept: (callId: string) => void;
  onDecline: (callId: string) => void;
}

export function IncomingCallScreen({ onAccept, onDecline }: Props) {
  const incoming = useCall((s) => s.incoming);
  if (!incoming) return null;

  const isVideo = incoming.media === 'video';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tag}>{isVideo ? 'Chamada de vídeo' : 'Chamada de áudio'}</Text>
        <Text style={styles.caller}>{incoming.callerName ?? 'Portaria'}</Text>
        <Text style={styles.sub}>está chamando…</Text>
      </View>

      <View style={styles.actions}>
        <Action label="Recusar" color={colors.error} onPress={() => onDecline(incoming.callId)} />
        <Action label="Atender" color={colors.success} onPress={() => onAccept(incoming.callId)} />
      </View>
    </View>
  );
}

function Action({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark, justifyContent: 'space-between', paddingVertical: spacing.xxl * 2 },
  header: { alignItems: 'center', marginTop: spacing.xxl * 2 },
  tag: { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.lg, textTransform: 'uppercase', letterSpacing: 1 },
  caller: { color: colors.textOnDark, fontSize: typography.size.xxl, fontWeight: typography.weight.bold },
  sub: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.xl },
  actionBtn: { flex: 1, height: 56, marginHorizontal: spacing.sm, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: colors.textOnAccent, fontSize: typography.size.md, fontWeight: typography.weight.semibold },
});
