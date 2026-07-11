/**
 * Client HTTP da API, injetado nos hooks de cada feature como `api`.
 *
 * Um único ponto que resolve a base URL (api/config.ts), anexa o access token
 * (JWT do login por OTP) da sessão e normaliza erros. Os hooks só declaram o
 * tipo de retorno: `api.get<T>(path)` / `api.post<T>(path, body?)`.
 */
import { API_URL } from './config';
import { useSession } from '../stores/session';

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<T> {
  const access = useSession.getState().access;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(access ? { authorization: `Bearer ${access}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message ?? `Erro ${res.status}`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
};
