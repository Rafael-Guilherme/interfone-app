import { create } from 'zustand';
import type { AuthUser, Profile, Session } from '../api/client';

/**
 * Sessão do morador — access token (JWT do login por OTP) + perfis do usuário
 * (condomínio, papel, unidades). O socket de chamadas usa o access token; o
 * servidor deriva as unidades do morador a partir do JWT.
 */
interface SessionState {
  access: string | null;
  user: AuthUser | null;
  profiles: Profile[];
  signIn: (s: Session) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>((set) => ({
  access: null,
  user: null,
  profiles: [],
  signIn: (s) => set({ access: s.access, user: s.user, profiles: s.profiles }),
  signOut: () => set({ access: null, user: null, profiles: [] }),
}));
