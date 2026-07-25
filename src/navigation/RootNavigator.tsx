import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { useSession } from '../stores/session';
import { useActive } from '../stores/active';
import { OnboardingNavigator } from './OnboardingNavigator';
import { SelectNavigator } from './SelectNavigator';
import { ManagerApp } from './ManagerNavigator';
import { CallApp } from '../features/calls/CallApp';
import { usePushRegistration } from '../push/usePushRegistration';
import { usePushCallListener } from '../push/usePushCallListener';

/**
 * Porta de entrada, em 5 vias:
 *   0. restaurando a sessão gravada → splash;
 *   1. sem access                → onboarding (Welcome/RoleSelect/OTP);
 *   2. access, sem interfone ativo selecionado → seletor de interfones;
 *   3. interfone ativo = gestor → app do gestor;
 *   4. interfone ativo = morador → app de chamadas.
 *
 * Cada área traz sua própria navegação; o RootNavigator só escolhe qual montar.
 */
export function RootNavigator() {
  const access = useSession((s) => s.access);
  const restaurando = useSession((s) => s.restaurando);
  const restaurar = useSession((s) => s.restaurar);
  const kind = useActive((s) => s.kind);

  // Uma vez por abertura do app: lê a sessão do armazenamento seguro e a
  // renova. É o que faz a notificação de chamada abrir direto na chamada, em
  // vez de na tela de login.
  useEffect(() => {
    void restaurar();
  }, [restaurar]);

  // Push fica aqui, e não dentro do app do morador: o gestor também é morador
  // em algum interfone, e o registro do aparelho vale para a sessão inteira —
  // não para a área que está aberta no momento.
  usePushRegistration();
  usePushCallListener();

  if (restaurando) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!access) return <OnboardingNavigator />;
  if (kind === 'manager') return <ManagerApp />;
  if (kind === 'resident') return <CallApp />;
  return <SelectNavigator />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
