import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSession } from '../stores/session';
import { OnboardingNavigator } from './OnboardingNavigator';
import { ManagerApp } from './ManagerNavigator';
import { CallApp } from '../features/calls/CallApp';

/**
 * Porta de entrada, decidida pelo perfil ATIVO do usuário:
 *   - gestor ativo  → app do síndico (painel de gestão);
 *   - morador ativo → app de chamadas;
 *   - sem perfil ativo (inclui síndico recém-cadastrado `pending`) → onboarding.
 *
 * CallApp/ManagerApp trazem sua própria navegação; por isso o NavigationContainer
 * do onboarding fica só no ramo não-autenticado.
 */
export function RootNavigator() {
  const access = useSession((s) => s.access);
  const profiles = useSession((s) => s.profiles);
  const active = access ? profiles.find((p) => p.status === 'active') : undefined;

  if (active && (active.role === 'manager' || active.role === 'sub_manager')) return <ManagerApp />;
  if (active) return <CallApp />;

  return (
    <NavigationContainer>
      <OnboardingNavigator />
    </NavigationContainer>
  );
}
