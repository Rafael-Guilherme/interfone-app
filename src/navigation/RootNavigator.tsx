import React from 'react';
import { useSession } from '../stores/session';
import { useActive } from '../stores/active';
import { OnboardingNavigator } from './OnboardingNavigator';
import { SelectNavigator } from './SelectNavigator';
import { ManagerApp } from './ManagerNavigator';
import { CallApp } from '../features/calls/CallApp';

/**
 * Porta de entrada, em 4 vias:
 *   1. sem access                → onboarding (Welcome/RoleSelect/OTP);
 *   2. access, sem interfone ativo selecionado → seletor de interfones;
 *   3. interfone ativo = gestor → app do gestor;
 *   4. interfone ativo = morador → app de chamadas.
 *
 * Cada área traz sua própria navegação; o RootNavigator só escolhe qual montar.
 */
export function RootNavigator() {
  const access = useSession((s) => s.access);
  const kind = useActive((s) => s.kind);

  if (!access) return <OnboardingNavigator />;
  if (kind === 'manager') return <ManagerApp />;
  if (kind === 'resident') return <CallApp />;
  return <SelectNavigator />;
}
