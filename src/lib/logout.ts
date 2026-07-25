import { useSession } from '../stores/session';
import { desregistrarAparelho } from '../push/usePushRegistration';
import { logout } from '../api/client';

/**
 * Sai da conta.
 *
 * A ordem importa: desregistrar o aparelho é uma chamada autenticada e revogar
 * o refresh precisa do próprio token, então os dois vêm ANTES de limpar a
 * sessão. Sem o primeiro, o celular continua tocando as chamadas de quem saiu;
 * sem o segundo, o refresh seguiria válido por 7 dias no servidor.
 *
 * Nenhum dos dois pode impedir o logout: sem rede, o usuário sai do mesmo jeito
 * e o servidor descarta o que ficou para trás quando o prazo vencer.
 */
export async function sair() {
  const { refresh } = useSession.getState();

  await desregistrarAparelho();
  if (refresh) await logout(refresh).catch(() => undefined);

  await useSession.getState().encerrar();
}
