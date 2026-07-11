/**
 * Tipos de navegação do onboarding (①). Cada rota mapeia para os params que
 * as telas recebem via `route.params` / passam em `navigation.navigate`.
 */

export type OnboardingStackParamList = {
  Welcome: undefined;
  Login: undefined;
  VerifyCode: { email: string };
  CondoCode: undefined;
  ConfirmCondo: { joinCode: string };
  BlockAndUnit: { condoId: string };
};
