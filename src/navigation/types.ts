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

/**
 * Área do síndico aprovado (③). Um único ParamList compartilhado por todos os
 * navegadores da área (pilha raiz + as pilhas de cada aba). Cada navegador
 * registra só um subconjunto; as telas navegam por nome (a navegação sobe a
 * árvore), mantendo a tab bar visível e a aba ativa destacada nas subtelas.
 */
export type ManagerStackParamList = {
  // raiz
  InterfoneSelect: undefined;
  Tabs: undefined;
  AddRole: undefined;
  ManagerRegister: { fromManager?: boolean } | undefined;
  JoinUnit: undefined;
  // aba Início
  Panel: undefined;
  Residents: undefined;
  ShareAccess: undefined;
  Announce: undefined;
  QRCodes: undefined;
  // aba Gestão
  Structure: undefined;
  EditInfo: undefined;
  // aba Comuns
  CommonAreas: undefined;
  AreaBookings: { areaId: string; areaName: string };
  AreaForm: { area?: { id: string; name: string; capacity: number | null; fee_cents: number | null } } | undefined;
};

/** Tabs do rodapé (③): Início / Gestão / Comuns / Perfil. */
export type ManagerTabParamList = {
  Inicio: undefined;
  Gestao: undefined;
  Comuns: undefined;
  Perfil: undefined;
};
