import React, { useMemo, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { colors, spacing, radii, typography } from '../theme';

/**
 * Código de verificação (OTP) com uma caixa por dígito.
 *
 * Guarda um único `TextInput` invisível por trás das caixas: o teclado do
 * celular preenche tudo (inclusive o autofill de SMS/e-mail), e as caixas são
 * só a representação visual. Bem mais robusto no Android/iOS do que N inputs
 * separados disputando foco — que costuma perder dígitos e brigar com o
 * preenchimento automático.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  onComplete,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  onComplete?: (v: string) => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  const [focado, setFocado] = useState(false);

  const digitos = useMemo(() => value.split('').slice(0, length), [value, length]);
  const focar = () => ref.current?.focus();

  const aoMudar = (texto: string) => {
    const limpo = texto.replace(/\D/g, '').slice(0, length);
    onChange(limpo);
    if (limpo.length === length) onComplete?.(limpo);
  };

  // Backspace numa caixa vazia continua apagando (o input escondido cuida).
  const aoTecla = (_e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {};

  return (
    <Pressable style={styles.linha} onPress={focar} accessibilityRole="none">
      {Array.from({ length }).map((_, i) => {
        const preenchido = i < digitos.length;
        // A "caixa ativa" é a próxima a receber dígito (ou a última, se cheio).
        const ativa = focado && (i === digitos.length || (digitos.length === length && i === length - 1));
        return (
          <View
            key={i}
            style={[styles.caixa, ativa && styles.caixaAtiva, preenchido && styles.caixaPreenchida]}
          >
            <Text style={styles.digito}>{digitos[i] ?? ''}</Text>
            {ativa && !preenchido ? <View style={styles.cursor} /> : null}
          </View>
        );
      })}

      {/* Input real, invisível, cobrindo toda a linha. */}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={aoMudar}
        onKeyPress={aoTecla}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={length}
        style={styles.escondido}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  caixa: {
    flex: 1,
    aspectRatio: 0.82,
    maxWidth: 56,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaAtiva: { borderColor: colors.accent },
  caixaPreenchida: { borderColor: colors.text },
  digito: { fontSize: 24, fontWeight: typography.weight.bold, color: colors.text },
  cursor: { position: 'absolute', width: 2, height: 24, backgroundColor: colors.accent, borderRadius: 1 },
  // Cobre a linha inteira, invisível, para capturar toque e teclado.
  escondido: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
});
