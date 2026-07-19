import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { useSession } from '../../stores/session';
import { getFeed, useResidentCondo } from './resident.api';

/** Início do morador (②·1) — saudação, unidade, aguardando portaria + atalhos. */
export function ResidentHomeScreen() {
  const nav = useNavigation<any>();
  const user = useSession((s) => s.user);
  const profiles = useSession((s) => s.profiles);
  const condo = useResidentCondo();
  const [unread, setUnread] = useState(0);

  const profile = profiles.find((p) => p.condominium.id === condo?.condoId && p.role === 'resident');
  const unit = profile?.units[0]?.label;

  useFocusEffect(
    useCallback(() => {
      if (condo) getFeed(condo.condoId).then((f) => setUnread(f.filter((x) => !x.read).length)).catch(() => {});
    }, [condo?.condoId]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.hi}>Olá, {user?.name?.split(' ')[0] ?? 'morador'}</Text>
        {unit ? <Text style={styles.unit}>{condo?.condoName} · {unit}</Text> : <Text style={styles.unit}>{condo?.condoName}</Text>}

        <View style={styles.waitCard}>
          <View style={styles.dot} />
          <Text style={styles.waitTitle}>Pronto para atender a portaria</Text>
          <Text style={styles.waitSub}>Quando a portaria ou um entregador chamar sua unidade, a chamada aparece em tela cheia.</Text>
        </View>

        <View style={styles.grid}>
          <Shortcut emoji="📣" label="Comunicados" badge={unread || undefined} onPress={() => nav.navigate('Comunicados')} />
          <Shortcut emoji="📅" label="Reservas" onPress={() => nav.navigate('Reservas')} />
          <Shortcut emoji="✉️" label="Recados" onPress={() => nav.navigate('Recados')} />
          <Shortcut emoji="▦" label="Meus QR" onPress={() => nav.navigate('MeusQr')} />
          <Shortcut emoji="🕘" label="Histórico" onPress={() => nav.navigate('Historico')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Shortcut({ emoji, label, badge, onPress }: { emoji: string; label: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.short, pressed && styles.shortPressed]} onPress={onPress}>
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
      <Text style={styles.shortEmoji}>{emoji}</Text>
      <Text style={styles.shortLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  hi: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  unit: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.xl },
  waitCard: { backgroundColor: colors.card, borderRadius: radii.card, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  dot: { width: 14, height: 14, borderRadius: 999, backgroundColor: colors.success, marginBottom: spacing.md },
  waitTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.xs },
  waitSub: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  short: { width: '47%', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xl, alignItems: 'center' },
  shortPressed: { borderColor: colors.text },
  shortEmoji: { fontSize: 28, marginBottom: spacing.sm },
  shortLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text },
  badge: { position: 'absolute', top: spacing.sm, right: spacing.sm, minWidth: 20, height: 20, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: colors.textOnAccent, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
});
