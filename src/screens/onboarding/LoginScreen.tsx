/**
 * Entrar (①·2) — entrada passwordless: só e-mail, sem senha. Dispara o envio do
 * OTP e navega para a verificação. Google sign-in aparece como alternativa.
 */
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { Field, PrimaryButton, ScreenTitle } from "../../components/ui";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useRequestOtp } from "../../features/onboarding/onboarding.hooks";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Login">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const requestOtp = useRequestOtp();

  const valid = EMAIL_RE.test(email.trim());

  const submit = () => {
    const normalized = email.trim().toLowerCase();
    requestOtp.mutate(
      { email: normalized },
      {
        onSuccess: () =>
          navigation.navigate("VerifyCode", { email: normalized }),
        onError: () =>
          Alert.alert(
            "Erro",
            "Não foi possível enviar o código. Tente de novo.",
          ),
      },
    );
  };

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="Entrar"
        subtitle="Enviaremos um código de acesso para o seu e-mail."
      />
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        inputMode="email"
      />
      <PrimaryButton
        label="Enviar código"
        onPress={submit}
        disabled={!valid}
        loading={requestOtp.isPending}
      />

      {/* Login/cadastro com Google desativado por enquanto.
      <View style={styles.divider}>
        <Text style={styles.dividerText}>ou</Text>
      </View>

      <Pressable
        style={styles.google}
        onPress={() => {
          // Google sign-in
        }}
      >
        <Text style={styles.googleText}>Continuar com Google</Text>
      </Pressable>
      */}
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
  divider: { alignItems: "center", marginVertical: spacing.xl },
  dividerText: { color: colors.textSecondary, fontSize: typography.size.sm },
  google: {
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  googleText: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
