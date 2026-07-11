/**
 * Tipos de domínio compartilhados entre features (no monorepo, movem-se para
 * packages/shared-types). Espelham os contratos da API consumidos pelos hooks.
 */
import type { AuthUser, Profile } from './api/client';
import type { CallMedia, MediaGrant } from './stores/call';

export type { CallMedia };

/** Tokens de /auth/otp/verify — o access (JWT) autentica as demais chamadas. */
export interface AuthTokens {
  access: string;
  refresh?: string;
}

/** Perfil do usuário autenticado (/me). Pode vir sem nenhum profile ainda. */
export interface Me {
  user: AuthUser;
  profiles: Profile[];
}

/**
 * Resposta de iniciar/atender chamada: o estado da chamada + o grant de mídia
 * (provider/token/url) que a tela usa para entrar na sala LiveKit.
 */
export interface CallMediaGrant {
  call: { id: string; status: string; media: CallMedia };
  media: MediaGrant;
}
