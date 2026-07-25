/**
 * Sessão guardada no aparelho, para o app abrir já logado.
 *
 * Vai no armazenamento seguro (Keychain no iOS, Keystore no Android): o refresh
 * token vale 7 dias e renova sozinho, então quem o copiasse teria a conta —
 * `AsyncStorage` seria texto puro no sistema de arquivos do app.
 *
 * No Expo Web o SecureStore não existe; ali caímos no `localStorage`, que é o
 * que o navegador oferece. O web é só o ambiente de teste do fluxo, não o
 * produto — em aparelho real sempre passa pelo armazenamento seguro.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHAVE = 'interfone.sessao';

/** O que precisamos para reabrir o app exatamente onde o usuário parou. */
export interface SessaoSalva {
  access: string;
  refresh: string;
  /** Interfone/cargo escolhido no seletor — sem isso, toda abertura cairia nele. */
  ativo?: {
    kind: 'manager' | 'resident';
    condoId: string;
    condoName: string;
    profileId: string;
  } | null;
}

const web = Platform.OS === 'web';

export async function salvarSessao(sessao: SessaoSalva) {
  const valor = JSON.stringify(sessao);
  try {
    if (web) localStorage.setItem(CHAVE, valor);
    else await SecureStore.setItemAsync(CHAVE, valor);
  } catch {
    // Sem persistência o app ainda funciona — só volta a pedir login ao fechar.
  }
}

export async function lerSessao(): Promise<SessaoSalva | null> {
  try {
    const valor = web ? localStorage.getItem(CHAVE) : await SecureStore.getItemAsync(CHAVE);
    if (!valor) return null;
    const dados = JSON.parse(valor) as SessaoSalva;
    return dados?.refresh ? dados : null;
  } catch {
    return null;
  }
}

/**
 * Atualiza só o interfone ativo, preservando os tokens.
 *
 * Fica aqui (e não na store de sessão) para a store `active` não precisar
 * importar a de sessão, que já importa a `active` — seria um ciclo.
 */
export async function salvarAtivo(ativo: SessaoSalva['ativo']) {
  const atual = await lerSessao();
  if (!atual) return; // sem sessão gravada não há o que atualizar
  await salvarSessao({ ...atual, ativo });
}

export async function limparSessao() {
  try {
    if (web) localStorage.removeItem(CHAVE);
    else await SecureStore.deleteItemAsync(CHAVE);
  } catch {
    // idem: nada a fazer, o pior caso é uma sessão órfã que o servidor recusa.
  }
}
