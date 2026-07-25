import { create } from 'zustand';
import { salvarAtivo, type SessaoSalva } from './sessionStorage';

/**
 * Interfone/cargo ATIVO escolhido no seletor (após o login). Um usuário pode ter
 * vários interfones com cargos diferentes; enquanto nenhum está selecionado, o
 * RootNavigator mostra o seletor. `signupIntent` guarda a escolha morador/gestor
 * feita antes do OTP, para redirecionar um usuário novo direto ao fluxo certo.
 *
 * A escolha é gravada junto da sessão: reabrir o app cai direto no interfone
 * que estava em uso, e não no seletor.
 */
type Ativo = NonNullable<SessaoSalva['ativo']>;

interface ActiveState {
  kind: 'manager' | 'resident' | null;
  condoId: string | null;
  condoName: string | null;
  profileId: string | null;
  signupIntent: 'resident' | 'manager' | null;

  enter: (a: Ativo) => void;
  leave: () => void;
  setIntent: (i: 'resident' | 'manager' | null) => void;
  /** Recorte gravável do estado — `null` quando nenhum interfone está ativo. */
  paraSalvar: () => Ativo | null;
}

export const useActive = create<ActiveState>((set, get) => ({
  kind: null,
  condoId: null,
  condoName: null,
  profileId: null,
  signupIntent: null,

  enter: (a) => {
    set({ ...a });
    void salvarAtivo(a);
  },

  leave: () => {
    set({ kind: null, condoId: null, condoName: null, profileId: null });
    void salvarAtivo(null);
  },

  setIntent: (signupIntent) => set({ signupIntent }),

  paraSalvar: () => {
    const { kind, condoId, condoName, profileId } = get();
    if (!kind || !condoId || !profileId) return null;
    return { kind, condoId, condoName: condoName ?? '', profileId };
  },
}));
