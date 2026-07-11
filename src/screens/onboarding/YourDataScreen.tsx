/**
 * Seus dados + Bloco/unidade (①·6–7 consolidados no esqueleto) — coleta unidade,
 * nome e telefone e chama /join. Ao concluir, o Profile nasce pending: o hook
 * recarrega /me e o RootNavigator troca sozinho para a tela "Aguardando
 * aprovação" (não há navegação manual para lá — é o gate que reage).
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme';
import { Field, PrimaryButton, ScreenTitle } from '../../components/ui';
import { useCondoBlocks, useJoinCondo } from '../../api/onboarding.hooks';
import { useSession } from '../../stores/session';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BlockAndUnit'>;

export function YourDataScreen({ route }: Props) {
  const { condoId } = route.params;
  const me = useSession((s) => s.me);

  const { data: blocks, isLoading } = useCondoBlocks(condoId);
  const join = useJoinCondo();

  const [blockId, setBlockId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [name, setName] = useState(me?.name ?? '');
  const [phone, setPhone] = useState('');

  const units = useMemo(
    () => blocks?.find((b) => b.id === blockId)?.units ?? [],
    [blocks, blockId],
  );

  const canSubmit = !!unitId && name.trim().length > 1;

  const submit = () => {
    if (!unitId) return;
    // join_code é resolvido no backend a partir do condo; aqui reusamos o fluxo:
    join.mutate(
      { join_code: condoId, unit_id: unitId, name: name.trim(), phone: phone.trim() || undefined },
      {
        onError: () =>
          Alert.alert('Erro', 'Não foi possível concluir o cadastro. Tente novamente.'),
        // sucesso: sem navegação — o RootNavigator vai para PendingApproval.
      },
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTitle title="Seus dados" subtitle="Confirme sua unidade e seus dados." />

      <Text style={styles.label}>Bloco</Text>
      <View style={styles.chips}>
        {blocks?.map((b) => (
          <Chip
            key={b.id}
            label={b.name}
            active={b.id === blockId}
            onPress={() => {
              setBlockId(b.id);
              setUnitId(null);
            }}
          />
        ))}
      </View>

      {blockId ? (
        <>
          <Text style={styles.label}>Unidade</Text>
          <View style={styles.chips}>
            {units.map((u) => (
              <Chip
                key={u.id}
                label={u.number}
                active={u.id === unitId}
                onPress={() => setUnitId(u.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      <View style={{ height: spacing.lg }} />
      <Field label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" />
      <Field
        label="Telefone (opcional)"
        value={phone}
        onChangeText={setPhone}
        placeholder="(00) 00000-0000"
        keyboardType="phone-pad"
      />

      <PrimaryButton
        label="Criar conta"
        onPress={submit}
        disabled={!canSubmit}
        loading={join.isPending}
      />
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: spacing.xxl * 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: typography.weight.medium,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  chipTextActive: { color: colors.textOnAccent },
});
