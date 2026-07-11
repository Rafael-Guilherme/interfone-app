import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, radii } from './src/theme';
import { PrimaryButton, Field, ScreenTitle } from './src/components/ui';
import { useSession } from './src/stores/session';
import { useCall } from './src/stores/call';
import { requestOtp, verifyOtp } from './src/api/client';
import { useResidentCall } from './src/features/calls/useResidentCall';
import { IncomingCallScreen } from './src/features/calls/IncomingCallScreen';
import { InCallScreen } from './src/features/calls/InCallScreen';

export default function App() {
  const access = useSession((s) => s.access);
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {access ? <ResidentApp /> : <SignInScreen />}
    </View>
  );
}

/** Login passwordless por OTP de e-mail, contra a API real. */
function SignInScreen() {
  const signIn = useSession((s) => s.signIn);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('ana@demo.test');
  const [code, setCode] = useState('');
  const [devHint, setDevHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRequest = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await requestOtp(email.trim());
      if (r.devCode) {
        setCode(r.devCode); // dev: já preenche o código
        setDevHint(`Código (dev): ${r.devCode}`);
      }
      setStep('code');
    } catch (e: any) {
      setError(e.message ?? 'Falha ao enviar código');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await verifyOtp(email.trim(), code.trim());
      signIn(session);
    } catch (e: any) {
      setError(e.message ?? 'Código inválido');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <ScreenTitle
        title="Interfone"
        subtitle={step === 'email' ? 'Entre com seu e-mail para receber um código' : `Enviamos um código para ${email}`}
      />
      {step === 'email' ? (
        <>
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label={busy ? 'Enviando…' : 'Enviar código'} onPress={onRequest} loading={busy} />
        </>
      ) : (
        <>
          <Field label="Código de 6 dígitos" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          {devHint ? <Text style={styles.devHint}>{devHint}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label={busy ? 'Entrando…' : 'Entrar'} onPress={onVerify} loading={busy} />
          <Pressable onPress={() => setStep('email')} style={styles.signOut}>
            <Text style={styles.signOutText}>trocar e-mail</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

/** App do morador: monta a ponte de chamada e roteia pela fase do store. */
function ResidentApp() {
  const phase = useCall((s) => s.phase);
  const reset = useCall((s) => s.reset);
  const { answer, decline, end } = useResidentCall();

  useEffect(() => {
    if (phase === 'ended') {
      const t = setTimeout(reset, 1400);
      return () => clearTimeout(t);
    }
  }, [phase, reset]);

  if (phase === 'incoming') {
    return <IncomingCallScreen onAccept={() => answer()} onDecline={() => decline()} />;
  }
  if (phase === 'connecting' || phase === 'inCall') {
    return <InCallScreen onEnd={async () => end()} />;
  }
  if (phase === 'ended') {
    return (
      <View style={styles.center}>
        <Text style={styles.endedText}>Chamada encerrada</Text>
      </View>
    );
  }
  return <HomeIdle />;
}

/** Início (②·1, simplificado): mostra a unidade e aguarda a portaria chamar. */
function HomeIdle() {
  const user = useSession((s) => s.user);
  const profiles = useSession((s) => s.profiles);
  const signOut = useSession((s) => s.signOut);
  const unit = profiles[0]?.units[0];
  const condo = profiles[0]?.condominium.name;

  return (
    <View style={styles.pad}>
      <ScreenTitle
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'morador'}`}
        subtitle={unit ? `${condo} · ${unit.label}` : condo}
      />
      <View style={styles.waitCard}>
        <View style={styles.dot} />
        <Text style={styles.waitTitle}>Aguardando chamadas</Text>
        <Text style={styles.waitSub}>
          Quando a portaria (web do entregador) chamar sua unidade, a chamada aparece aqui.
        </Text>
      </View>
      <Pressable onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingTop: spacing.xxl * 2, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  waitCard: { backgroundColor: colors.card, borderRadius: radii.card, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  dot: { width: 14, height: 14, borderRadius: 999, backgroundColor: colors.success, marginBottom: spacing.lg },
  waitTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.sm },
  waitSub: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  signOut: { marginTop: spacing.xl, alignItems: 'center' },
  signOutText: { color: colors.textSecondary, fontSize: typography.size.sm },
  endedText: { fontSize: typography.size.lg, color: colors.textSecondary },
  error: { color: colors.error, fontSize: typography.size.sm, marginBottom: spacing.md },
  devHint: { color: colors.warning, fontSize: typography.size.sm, marginBottom: spacing.md },
});
