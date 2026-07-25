/**
 * Client HTTP da API, injetado nos hooks de cada feature como `api`.
 *
 * Um único ponto que resolve a base URL (api/config.ts), anexa o access token
 * (JWT do login por OTP) da sessão e normaliza erros. Os hooks só declaram o
 * tipo de retorno: `api.get<T>(path)` / `api.post<T>(path, body?)`.
 */
import { API_URL } from './config';
import { useSession } from '../stores/session';
import { renovarSessao } from './refresh';

function enviar(method: string, path: string, access: string | null, body?: unknown) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(access ? { authorization: `Bearer ${access}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  let res = await enviar(method, path, useSession.getState().access, body);

  // O access dura 30 minutos: 401 quase sempre é só ele vencendo, não sessão
  // perdida. Renova uma vez e repete a requisição — o usuário não vê nada.
  // Uma única tentativa, de propósito: se o 401 persistir, insistir só geraria
  // laço contra um servidor que já disse não.
  if (res.status === 401) {
    const novo = await renovarSessao();
    if (novo) res = await enviar(method, path, novo, body);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message ?? `Erro ${res.status}`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  // PUT é idempotente: usado para "marcar/desmarcar" um dia indisponível.
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  // Aceita corpo: desregistrar um aparelho manda o token do push, que tem
  // colchetes e não passa limpo na URL.
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
};
