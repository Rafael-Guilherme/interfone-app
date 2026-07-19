import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, radii } from '../theme';

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        off && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <Text style={styles.btnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  containerStyle,
  style,
  ...props
}: { label?: string; containerStyle?: StyleProp<ViewStyle> } & TextInputProps) {
  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      {/* Sem label: o campo está dentro de um grupo que já tem o seu (ex.: taxa
          com o "R$" ao lado), então não reservamos a linha do rótulo. */}
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        // `style` por último e MESCLADO: antes um `style` vindo de fora
        // substituía styles.input inteiro e o campo perdia borda e altura.
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

export function ScreenTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/**
 * Cabeçalho padrão de tela interna: voltar + título grande + subtítulo.
 * Unifica o topo das telas do gestor, que antes misturavam título `xl` num
 * bloco de header com título `xxl` solto.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <View style={styles.headerWrap}>
      <BackButton label={backLabel} onPress={onBack} />
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
    </View>
  );
}

/**
 * Voltar padrão do app. Antes cada tela resolvia (ou esquecia) o próprio
 * voltar; a seta sozinha também era um alvo pequeno demais. Aqui é seta +
 * palavra, num bloco com área de toque confortável.
 */
export function BackButton({ label = 'Voltar', onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
    >
      <Text style={styles.backIcon}>‹</Text>
      <Text style={styles.backLabel}>{label}</Text>
    </Pressable>
  );
}

/** Sair/encerrar sessão — vermelho de borda para não ser confundido com voltar. */
export function LogoutButton({ label = 'Sair da conta', onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}
    >
      {/* Emoji de porta em vez do glyph ⏻, que não renderiza em muitas fontes Android. */}
      <Text style={styles.logoutIcon}>🚪</Text>
      <Text style={styles.logoutLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: colors.textOnAccent,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  fieldWrap: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: typography.weight.medium,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.md,
    color: colors.text,
    backgroundColor: colors.card,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginLeft: -spacing.md, // alinha o texto com o conteúdo da tela
    borderRadius: radii.pill,
  },
  backPressed: { backgroundColor: colors.border },
  backIcon: { fontSize: 26, lineHeight: 28, color: colors.text, marginTop: -2 },
  backLabel: {
    fontSize: typography.size.md,
    color: colors.text,
    fontWeight: typography.weight.medium,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  logoutIcon: { fontSize: 16, color: colors.error },
  logoutLabel: {
    fontSize: typography.size.md,
    color: colors.error,
    fontWeight: typography.weight.semibold,
  },
  headerWrap: { marginBottom: spacing.lg },
  headerTitle: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.sm },
  headerSub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  titleWrap: { marginBottom: spacing.xl },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.size.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
