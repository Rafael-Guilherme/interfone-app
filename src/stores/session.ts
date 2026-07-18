import { create } from 'zustand';
import type { AuthUser, Profile, Session } from '../api/client';
import type { AuthTokens, Me } from '../types';
import { useActive } from './active';

/**
 * Sessão do morador — access token (JWT do login por OTP) + o /me (usuário e
 * perfis: condomínio, papel, unidades) + o perfil ativo. O socket de chamadas
 * usa o access token; o servidor deriva as unidades do morador a partir do JWT.
 *
 * Fluxo: verifyOtp → setTokens → api.get('/me') → setMe; join → setActiveProfile.
 */
interface SessionState {
  access: string | null;
  me: Me | null;
  /** Espelho de `me.user`, para telas que só precisam do usuário. */
  user: AuthUser | null;
  profiles: Profile[];
  activeProfileId: string | null;
  /** Fluxo legado (client.ts verifyOtp → Session), ainda usado pelo App.tsx. */
  signIn: (s: Session) => void;
  setTokens: (tokens: AuthTokens) => void;
  setMe: (me: Me) => void;
  setActiveProfile: (profileId: string) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>((set) => ({
  access: null,
  me: null,
  user: null,
  profiles: [],
  activeProfileId: null,
  signIn: (s) => set({ access: s.access, user: s.user, profiles: s.profiles }),
  setTokens: (tokens) => set({ access: tokens.access }),
  setMe: (me) => set({ me, user: me.user, profiles: me.profiles }),
  setActiveProfile: (profileId) => set({ activeProfileId: profileId }),
  signOut: () => {
    // limpa também o interfone/cargo ativo, senão um próximo login pularia o seletor
    useActive.getState().leave();
    useActive.getState().setIntent(null);
    set({ access: null, me: null, user: null, profiles: [], activeProfileId: null });
  },
}));
