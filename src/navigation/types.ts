/**
 * Tipos de navegação do onboarding (①). Cada rota mapeia para os params que
 * as telas recebem via `route.params`.
 */
export type OnboardingStackParamList = {
  Welcome: undefined;
  RoleSelect: undefined;
  /** OTP. intent decide o destino após autenticar (morador vs síndico). */
  Auth: { intent: 'resident' | 'manager' | 'login' };
  /** Wizard de cadastro do interfone (síndico). */
  ManagerRegister: undefined;
  RegisterSuccess: { condoName: string; joinCode?: string; qrToken?: string };
};

/** Área do síndico aprovado (③). */
export type ManagerStackParamList = {
  Panel: undefined;
  Residents: undefined;
  ShareAccess: undefined;
};
