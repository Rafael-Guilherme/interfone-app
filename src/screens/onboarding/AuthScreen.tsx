import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme';
import { PrimaryButton, Field, ScreenTitle } from '../../components/ui';
import { OtpInput } from '../../components/OtpInput';
import { requestOtp, verifyOtp, Session } from '../../api/client';
import { useSession } from '../../stores/session';
import { useActive } from '../../stores/active';
import type { OnboardingStackParamList } from '../../navigation/types';
import { BackLink } from './RoleSelectScreen';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Auth'>;

/**
 * Login/cadastro passwordless por OTP de e-mail. Após autenticar, decide o
 * destino pelo `intent`:
 *   - perfil ATIVO → o RootNavigator troca para o app automaticamente;
 *   - gestor sem condo → wizard de cadastro do interfone;
 *   - gestor já com condo pendente → tela de "aguardando autorização".
 */
export function AuthScreen({ route, navigation }: Props) {
  const { intent } = route.params;
  const signIn = useSession((s) => s.signIn);
  const setIntent = useActive((s) => s.setIntent);

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devHint, setDevHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = intent === 'manager' ? 'Acesse como gestor' : 'Entrar';

  const onRequest = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await requestOtp(email.trim());
      if (r.devCode) {
        setCode(r.devCode);
        setDevHint(`Código (dev): ${r.devCode}`);
      }
      setStep('code');
    } catch (e: any) {
      setError(e.message ?? 'Falha ao enviar código');
    } finally {
      setBusy(false);
    }
  };

  // `codigo` opcional: quando o OtpInput completa, passa o valor direto — o
  // state `code` ainda não re-renderizou nesse instante, então não confiamos nele.
  const onVerify = async (codigo?: string) => {
    const c = (codigo ?? code).trim();
    if (c.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await verifyOtp(email.trim(), c);
      routeAfterAuth(session);
    } catch (e: any) {
      setError(e.message ?? 'Código inválido');
    } finally {
      setBusy(false);
    }
  };

  const routeAfterAuth = (session: Session) => {
    // Guarda a intenção (morador/gestor) para o seletor redirecionar um usuário
    // novo direto ao fluxo certo. Ao setar o access, o RootNavigator troca para o
    // seletor de interfones.
    if (intent === 'resident' || intent === 'manager') setIntent(intent);
    signIn(session);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <BackLink onPress={() => (step === 'code' ? setStep('email') : navigation.goBack())} />
        <ScreenTitle
          title={title}
          subtitle={step === 'email' ? 'Enviamos um código de acesso para seu e-mail.' : `Código enviado para ${email}`}
        />
        {step === 'email' ? (
          <>
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="voce@email.com"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={busy ? 'Enviando…' : 'Enviar código'} onPress={onRequest} loading={busy} disabled={!email.includes('@')} />
          </>
        ) : (
          <>
            <Text style={styles.codeLabel}>Código de 6 dígitos</Text>
            <OtpInput value={code} onChange={setCode} onComplete={onVerify} />
            {devHint ? <Text style={styles.devHint}>{devHint}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={busy ? 'Entrando…' : 'Continuar'} onPress={() => onVerify()} loading={busy} disabled={code.length !== 6} />
            <Pressable onPress={() => setStep('email')} style={styles.link}>
              <Text style={styles.linkText}>trocar e-mail</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, flexGrow: 1 },
  link: { alignItems: 'center', paddingVertical: spacing.lg },
  linkText: { color: colors.textSecondary, fontSize: typography.size.sm },
  error: { color: colors.error, fontSize: typography.size.sm, marginBottom: spacing.md },
  devHint: { color: colors.warning, fontSize: typography.size.sm, marginBottom: spacing.md },
  codeLabel: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: typography.weight.medium },
});
