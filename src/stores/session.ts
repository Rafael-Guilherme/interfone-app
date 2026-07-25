import { create } from 'zustand';
import type { AuthUser, Profile, Session } from '../api/client';
import type { AuthTokens, Me } from '../types';
import { useActive } from './active';
import { limparSessao, lerSessao, salvarSessao } from './sessionStorage';
// Import circular por natureza (a renovação escreve nesta store). Funciona
// porque `renovarSessao` é uma declaração de função — está definida quando
// `restaurar()` roda, muito depois da inicialização dos dois módulos.
import { renovarSessao } from '../api/refresh';

/**
 * Sessão do morador — access token (JWT curto) + refresh (7 dias, com rotação)
 * + o /me (usuário e perfis: condomínio, papel, unidades) + o perfil ativo. O
 * socket de chamadas usa o access token; o servidor deriva as unidades do
 * morador a partir do JWT.
 *
 * A sessão é gravada no armazenamento seguro do aparelho, então o app abre já
 * logado — inclusive quando é aberto pela notificação de uma chamada, que é
 * justamente quando ninguém quer parar para digitar um código de e-mail.
 *
 * Fluxo: verifyOtp → signIn (grava) → api.get('/me') → setMe.
 * Na abertura seguinte: restaurar() → /auth/refresh → mesma sessão de volta.
 */
interface SessionState {
  access: string | null;
  refresh: string | null;
  me: Me | null;
  /** Espelho de `me.user`, para telas que só precisam do usuário. */
  user: AuthUser | null;
  profiles: Profile[];
  activeProfileId: string | null;
  /**
   * Verdadeiro até a sessão gravada ser conferida com o servidor. Enquanto
   * isso o app mostra o splash — sem esse estado, a tela de login apareceria
   * por um instante para quem já está logado.
   */
  restaurando: boolean;

  /** Fluxo legado (client.ts verifyOtp → Session), ainda usado pelo App.tsx. */
  signIn: (s: Session) => void;
  setTokens: (tokens: AuthTokens) => void;
  setMe: (me: Me) => void;
  setActiveProfile: (profileId: string) => void;
  /** Restaura a sessão gravada. Chamado uma vez, na abertura do app. */
  restaurar: () => Promise<void>;
  /** Limpa a sessão local sem falar com o servidor (ver `lib/logout.ts`). */
  encerrar: () => Promise<void>;
  signOut: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  access: null,
  refresh: null,
  me: null,
  user: null,
  profiles: [],
  activeProfileId: null,
  restaurando: true,

  signIn: (s) => {
    const refresh = s.refresh ?? get().refresh;
    set({ access: s.access, refresh, user: s.user, profiles: s.profiles });
    void salvarSessao({ access: s.access, refresh: refresh ?? '', ativo: useActive.getState().paraSalvar() });
  },

  setTokens: (tokens) => {
    const refresh = tokens.refresh ?? get().refresh;
    set({ access: tokens.access, refresh });
    void salvarSessao({ access: tokens.access, refresh: refresh ?? '', ativo: useActive.getState().paraSalvar() });
  },

  setMe: (me) => set({ me, user: me.user, profiles: me.profiles }),
  setActiveProfile: (profileId) => set({ activeProfileId: profileId }),

  restaurar: async () => {
    const salva = await lerSessao();
    if (!salva) {
      set({ restaurando: false });
      return;
    }

    // O interfone ativo volta ANTES da renovação: assim, quando ela responder,
    // o RootNavigator já monta a área certa em vez de piscar o seletor.
    if (salva.ativo) useActive.getState().enter(salva.ativo);
    set({ access: salva.access, refresh: salva.refresh });

    await renovarSessao();
    set({ restaurando: false });
  },

  encerrar: async () => {
    await limparSessao();
    get().signOut();
  },

  signOut: () => {
    // limpa também o interfone/cargo ativo, senão um próximo login pularia o seletor
    useActive.getState().leave();
    useActive.getState().setIntent(null);
    void limparSessao();
    set({
      access: null,
      refresh: null,
      me: null,
      user: null,
      profiles: [],
      activeProfileId: null,
      restaurando: false,
    });
  },
}));
