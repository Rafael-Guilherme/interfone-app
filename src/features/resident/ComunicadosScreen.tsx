import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radii } from '../../theme';
import { FeedItem, getFeed, markRead, useResidentCondo } from './resident.api';

const when = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

/** Comunicados (②·7) — feed dos avisos do síndico, com indicador de não-lido. */
export function ComunicadosScreen() {
  const nav = useNavigation<any>();
  const condo = useResidentCondo();
  const id = condo?.condoId;
  const [items, setItems] = useState<FeedItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try { setItems(await getFeed(id)); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (a: FeedItem) => {
    setOpen((o) => (o === a.id ? null : a.id));
    if (!a.read && id) { await markRead(id, a.id); setItems((xs) => xs.map((x) => (x.id === a.id ? { ...x, read: true } : x))); }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Comunicados</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>Nenhum comunicado por enquanto.</Text>
        ) : (
          items.map((a) => (
            <Pressable key={a.id} style={styles.card} onPress={() => toggle(a)}>
              <View style={styles.head}>
                {!a.read && <View style={styles.unread} />}
                <Text style={[styles.cardTitle, !a.read && styles.bold]}>{a.title}</Text>
                <Text style={styles.date}>{when(a.created_at)}</Text>
              </View>
              <Text style={styles.body} numberOfLines={open === a.id ? undefined : 2}>{a.body}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.md },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  empty: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.xl, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  unread: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.accent },
  cardTitle: { flex: 1, fontSize: typography.size.md, color: colors.text },
  bold: { fontWeight: typography.weight.bold },
  date: { fontSize: typography.size.xs, color: colors.textMuted },
  body: { fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 20 },
});
