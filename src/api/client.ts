import { API_URL } from './config';

export { API_URL };

export interface Unit {
  id: string;
  number: string;
  block: string | null;
  label: string;
}
export interface Profile {
  id: string;
  role: string;
  status: string;
  /** Permissões do sub-gestor. Vazio para `manager`, que tem acesso total. */
  permissions?: string[];
  condominium: { id: string; name: string; slug: string };
  units: Unit[];
}
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
}
export interface Session {
  access: string;
  user: AuthUser;
  profiles: Profile[];
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message ?? `Erro ${res.status}`);
  return data as T;
}

export function requestOtp(email: string) {
  return post<{ sent: boolean; devCode?: string }>('/auth/request-otp', { email });
}

export function verifyOtp(email: string, code: string) {
  return post<Session>('/auth/verify-otp', { email, code });
}
