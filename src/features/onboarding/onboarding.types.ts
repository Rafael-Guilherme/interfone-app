/**
 * Contratos do fluxo de onboarding (①), espelhando os endpoints de auth e
 * condominiums da API. No monorepo, movem-se para packages/shared-types.
 */
import type { AuthTokens } from '../types';

// --- auth ---
export interface RequestOtpBody {
  email: string;
}
export interface RequestOtpResponse {
  /** segundos até poder reenviar */
  resend_in: number;
}

export interface VerifyOtpBody {
  email: string;
  code: string;
}
/** Verificar OTP autentica o usuário (mesmo antes de ter perfil em algum condo). */
export type VerifyOtpResponse = AuthTokens;

// --- join / condominiums ---
export interface ResolveCondoResponse {
  condo: {
    id: string;
    name: string;
    address: string | null;
    photo_url: string | null;
    blocks_count: number;
    units_count: number;
  };
  join_code: string;
}

export interface CondoBlock {
  id: string;
  name: string;
  units: { id: string; number: string }[];
}

export interface JoinCondoBody {
  join_code: string;
  unit_id: string;
  name: string;
  phone?: string;
}
/** Entrar cria o Profile em status pending. */
export interface JoinCondoResponse {
  profile_id: string;
  status: 'pending';
}
