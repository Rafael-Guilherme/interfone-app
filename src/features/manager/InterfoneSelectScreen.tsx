import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { api } from '../../api';
import { useSession } from '../../stores/session';
import { useActive } from '../../stores/active';
import type { Me } from '../../types';

const isManager = (role: string) => role === 'manager' || role === 'sub_manager';
const roleLabel = (role: string) => (isManager(role) ? 'Síndico' : 'Morador');

/** Meus interfones (③·1) — escolhe qual interfone/cargo usar, ou adiciona novo. */
export function InterfoneSelectScreen() {
  const nav = useNavigation<any>();
  const setMe = useSession((s) => s.setMe);
  const signOut = useSession((s) => s.signOut);
  const enter = useActive((s) => s.enter);
  const signupIntent = useActive((s) => s.signupIntent);
  const setIntent = useActive((s) => s.setIntent);
  const [profiles, setProfiles] = useState<Me['profiles']>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const me = await api.get<Me>('/me');
      setMe(me);
      setProfiles(me.profiles);
      // Usuário novo (sem perfis): manda direto ao fluxo escolhido antes do OTP.
      if (me.profiles.length === 0 && signupIntent) {
        const to = signupIntent === 'manager' ? 'SindicoStart' : 'JoinUnit';
        setIntent(null);
        nav.replace(to);
      }
    } finally {
      setLoading(false);
    }
  }, [signupIntent]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (p: Me['profiles'][number]) => {
    if (p.status !== 'active') return;
    enter({
      kind: isManager(p.role) ? 'manager' : 'resident',
      condoId: p.condominium.id,
      condoName: p.condominium.name,
      profileId: p.id,
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Meus interfones</Text>
        <Text style={styles.sub}>Escolha qual interfone usar ou adicione um novo.</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : (
          <>
            {profiles.length === 0 && <Text style={styles.empty}>Você ainda não está em nenhum interfone.</Text>}
            {profiles.map((p) => {
              const pending = p.status !== 'active';
              const unit = p.units[0]?.label;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => open(p)}
                  style={({ pressed }) => [styles.card, pressed && !pending && styles.cardPressed, pending && styles.cardPending]}
                >
                  <View style={styles.thumb}><Text style={styles.thumbText}>{p.condominium.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.condominium.name}</Text>
                    <Text style={styles.role}>{roleLabel(p.role)}{unit ? ` · ${unit}` : ''}</Text>
                    {pending ? (
                      <Text style={styles.pendingText}>{p.status === 'blocked' ? 'Acesso recusado' : 'Aguardando aprovação'}</Text>
                    ) : (
                      <Text style={styles.activeText}>Entrar ›</Text>
                    )}
                  </View>
                  {pending && <View style={styles.badge}><Text style={styles.badgeText}>{p.status === 'blocked' ? 'recusado' : 'pendente'}</Text></View>}
                </Pressable>
              );
            })}

            <Pressable style={styles.add} onPress={() => nav.navigate('AddRole')}>
              <Text style={styles.addText}>＋ Adicionar interfone</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  cardPressed: { borderColor: colors.text },
  cardPending: { opacity: 0.7 },
  thumb: { width: 44, height: 44, borderRadius: radii.button, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  thumbText: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  role: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 1 },
  activeText: { fontSize: typography.size.sm, color: colors.accent, marginTop: 2 },
  pendingText: { fontSize: typography.size.xs, color: colors.warning, marginTop: 2 },
  badge: { backgroundColor: colors.warningBg, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { color: colors.warning, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  add: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginTop: spacing.sm },
  addText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
  signOut: { marginTop: 'auto', alignItems: 'center', paddingTop: spacing.xxl },
  signOutText: { color: colors.textSecondary, fontSize: typography.size.sm },
});
