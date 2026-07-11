/**
 * Código de verificação (①·3) — 6 dígitos, timer de reenvio, escape "trocar
 * e-mail". Ao verificar com sucesso, o hook guarda os tokens e carrega /me; o
 * RootNavigator então recalcula a árvore (onboarding continua se ainda não há
 * perfil em nenhum condo, seguindo para o código do condomínio).
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { colors, spacing, typography, radii } from "../../theme";
import { PrimaryButton, ScreenTitle } from "../../components/ui";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import {
  useRequestOtp,
  useVerifyOtp,
} from "../../features/onboarding/onboarding.hooks";

type Props = NativeStackScreenProps<OnboardingStackParamList, "VerifyCode">;

const CODE_LEN = 6;
const RESEND_SECONDS = 30;

export function VerifyCodeScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  const verify = useVerifyOtp();
  const requestOtp = useRequestOtp();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const submit = (value: string) => {
    verify.mutate(
      { email, code: value },
      {
        onError: () => {
          Alert.alert("Código inválido", "Verifique e tente novamente.");
          setCode("");
        },
        // sucesso: nada a navegar — o RootNavigator troca a árvore ao ter /me.
        // Se o usuário ainda não tem perfil, o onboarding segue no CondoCode.
        onSuccess: () => navigation.navigate("CondoCode"),
      },
    );
  };

  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LEN);
    setCode(digits);
    if (digits.length === CODE_LEN) submit(digits);
  };

  const resend = () => {
    requestOtp.mutate({ email });
    setCountdown(RESEND_SECONDS);
  };

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="Código de verificação"
        subtitle={`Enviamos um código de 6 dígitos para ${email}.`}
      />

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes}>
        {Array.from({ length: CODE_LEN }).map((_, i) => (
          <View
            key={i}
            style={[styles.box, i === code.length && styles.boxActive]}
          >
            <Text style={styles.boxDigit}>{code[i] ?? ""}</Text>
          </View>
        ))}
      </Pressable>

      {/* input invisível que captura os dígitos */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={CODE_LEN}
        autoFocus
        style={styles.hiddenInput}
      />

      <PrimaryButton
        label="Confirmar"
        onPress={() => submit(code)}
        disabled={code.length !== CODE_LEN}
        loading={verify.isPending}
      />

      <View style={styles.footer}>
        {countdown > 0 ? (
          <Text style={styles.muted}>Reenviar código em {countdown}s</Text>
        ) : (
          <Pressable onPress={resend}>
            <Text style={styles.link}>Reenviar código</Text>
          </Pressable>
        )}
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Trocar e-mail</Text>
        </Pressable>
      </View>
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
  boxes: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  box: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  boxActive: { borderColor: colors.accent },
  boxDigit: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  hiddenInput: { position: "absolute", opacity: 0, height: 1, width: 1 },
  footer: { marginTop: spacing.xl, gap: spacing.md, alignItems: "center" },
  muted: { color: colors.textSecondary, fontSize: typography.size.sm },
  link: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
