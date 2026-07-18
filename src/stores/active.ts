import { create } from 'zustand';

/**
 * Interfone/cargo ATIVO escolhido no seletor (após o login). Um usuário pode ter
 * vários interfones com cargos diferentes; enquanto nenhum está selecionado, o
 * RootNavigator mostra o seletor. `signupIntent` guarda a escolha morador/síndico
 * feita antes do OTP, para redirecionar um usuário novo direto ao fluxo certo.
 */
interface ActiveState {
  kind: 'manager' | 'resident' | null;
  condoId: string | null;
  condoName: string | null;
  profileId: string | null;
  signupIntent: 'resident' | 'manager' | null;

  enter: (a: { kind: 'manager' | 'resident'; condoId: string; condoName: string; profileId: string }) => void;
  leave: () => void;
  setIntent: (i: 'resident' | 'manager' | null) => void;
}

export const useActive = create<ActiveState>((set) => ({
  kind: null,
  condoId: null,
  condoName: null,
  profileId: null,
  signupIntent: null,
  enter: (a) => set({ ...a }),
  leave: () => set({ kind: null, condoId: null, condoName: null, profileId: null }),
  setIntent: (signupIntent) => set({ signupIntent }),
}));
