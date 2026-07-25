/**
 * Renovação da sessão.
 *
 * O access token dura 30 minutos e o refresh, 7 dias com rotação: cada
 * renovação empurra o prazo. Quem usa o app nunca precisa digitar o código de
 * novo; quem ficar 7 dias sem abrir, faz login outra vez.
 *
 * Fica fora do `api/index.ts` de propósito: a renovação usa `fetch` direto,
 * senão um 401 na renovação chamaria a renovação de novo, em laço.
 */
import { API_URL } from './config';
import { useSession } from '../stores/session';
import type { Session } from './client';

/** Renovação em curso — várias requisições que tomam 401 juntas esperam a mesma. */
let emCurso: Promise<string | null> | null = null;

/** Margem para não usar um token que expira no meio da requisição. */
const MARGEM_MS = 60_000;

/** Lê o `exp` do JWT sem validar assinatura (quem valida é o servidor). */
function expiraEm(access: string): number | null {
  try {
    const [, payload] = access.split('.');
    const json = JSON.parse(
      // base64url → base64; `atob` existe no Hermes e no navegador.
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Troca o refresh por um par novo e atualiza a sessão. Devolve o access novo,
 * ou `null` quando a sessão morreu de vez (7 dias parado, token revogado, conta
 * bloqueada) — nesse caso o app volta para o login.
 */
export function renovarSessao(): Promise<string | null> {
  if (emCurso) return emCurso;

  emCurso = (async () => {
    const refresh = useSession.getState().refresh;
    if (!refresh) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        // 401 = sessão acabou. Erro de rede (que nem chega aqui) é outra coisa:
        // ali o token continua válido e vale tentar de novo depois.
        if (res.status === 401) await useSession.getState().encerrar();
        return null;
      }
      const sessao = (await res.json()) as Session;
      useSession.getState().signIn(sessao);
      return sessao.access;
    } catch {
      // Sem rede: mantém a sessão como está e tenta na próxima requisição.
      return null;
    } finally {
      emCurso = null;
    }
  })();

  return emCurso;
}

/**
 * Access válido para agora — renova antes se estiver vencido ou perto disso.
 * Usado antes de abrir o socket de chamadas, que valida o token só no handshake:
 * conectar com um token vencido derrubaria a conexão em vez de tocar.
 */
export async function garantirAccessValido(): Promise<string | null> {
  const { access } = useSession.getState();
  if (!access) return null;
  const exp = expiraEm(access);
  if (exp !== null && exp - Date.now() > MARGEM_MS) return access;
  return (await renovarSessao()) ?? null;
}
