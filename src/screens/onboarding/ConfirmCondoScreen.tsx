/**
 * Confirmar condomínio (①·5) — resolve o código e mostra o card (nome, endereço,
 * contagem de blocos/unidades). "Sim, é esse" segue para bloco & unidade;
 * "Não é esse" volta para digitar outro código.
 */
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors, spacing, typography, radii } from "../../theme";
import { PrimaryButton } from "../../components/ui";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useResolveCondo } from "../../features/onboarding/onboarding.hooks";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ConfirmCondo">;

export function ConfirmCondoScreen({ route, navigation }: Props) {
  const { joinCode } = route.params;
  const { data, isLoading, isError } = useResolveCondo(joinCode);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.error}>
          Condomínio não encontrado para este código.
        </Text>
        <PrimaryButton
          label="Tentar outro código"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const { condo } = data;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.photo}>
          <Text style={styles.photoLabel}>{condo.photo_url ? "" : "🏢"}</Text>
        </View>
        <Text style={styles.name}>{condo.name}</Text>
        {condo.address ? (
          <Text style={styles.addr}>{condo.address}</Text>
        ) : null}
        <View style={styles.stats}>
          <Stat value={condo.blocks_count} label="blocos" />
          <Stat value={condo.units_count} label="unidades" />
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Sim, é esse"
          onPress={() =>
            navigation.navigate("BlockAndUnit", { condoId: condo.id })
          }
        />
        <Text style={styles.no} onPress={() => navigation.goBack()}>
          Não é esse
        </Text>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.lg },
  error: {
    color: colors.error,
    fontSize: typography.size.md,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: radii.card,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  photoLabel: { fontSize: 40 },
  name: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  addr: {
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  stats: { flexDirection: "row", gap: spacing.xxl, marginTop: spacing.lg },
  stat: { alignItems: "center" },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.accent,
  },
  statLabel: { fontSize: typography.size.sm, color: colors.textSecondary },
  actions: { marginTop: spacing.xxl, gap: spacing.lg },
  no: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: typography.size.md,
    paddingVertical: spacing.sm,
  },
});
