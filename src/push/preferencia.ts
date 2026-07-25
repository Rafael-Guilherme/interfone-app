/**
 * Preferência de notificações — "não quero receber neste aparelho".
 *
 * Desligar não é só parar de mostrar: o aparelho é REMOVIDO do servidor, então
 * nenhum push chega a ser enviado para ele. É o comportamento honesto — e o
 * único que sobrevive ao app fechado, onde não há código nosso rodando para
 * filtrar nada.
 *
 * A escolha é por aparelho, não por conta: quem tem celular e tablet pode
 * querer ser chamado só no celular. Ela fica gravada localmente para o registro
 * automático da próxima abertura respeitá-la.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { registerDevice, unregisterDevice } from './push.api';
import { obterTokenDePush } from './usePushRegistration';

const CHAVE = 'interfone.push.ativo';
const web = Platform.OS === 'web';

export async function lerPreferencia(): Promise<boolean> {
  try {
    const v = web ? localStorage.getItem(CHAVE) : await SecureStore.getItemAsync(CHAVE);
    // Sem registro = nunca mexeu: o padrão é receber chamadas.
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

async function gravarPreferencia(ativo: boolean) {
  try {
    const v = String(ativo);
    if (web) localStorage.setItem(CHAVE, v);
    else await SecureStore.setItemAsync(CHAVE, v);
  } catch {
    // Sem persistência a escolha vale só nesta sessão; o efeito no servidor
    // (aparelho registrado ou não) já aconteceu de todo jeito.
  }
}

export type ResultadoPreferencia = 'ok' | 'sem_permissao' | 'falhou';

/**
 * Aplica a escolha do usuário.
 *
 * Ligar depende da permissão do sistema, que pode ter sido negada nas
 * configurações do aparelho — daí o retorno distinguir "não deu" de "o sistema
 * não deixa", que é o caso em que a tela precisa mandar o usuário aos ajustes.
 */
export async function definirPush(ativo: boolean): Promise<ResultadoPreferencia> {
  if (!ativo) {
    const token = await obterTokenDePush().catch(() => null);
    // Sem token não há o que desregistrar — a preferência sozinha já impede o
    // registro na próxima abertura.
    if (token) await unregisterDevice(token).catch(() => undefined);
    await gravarPreferencia(false);
    return 'ok';
  }

  const token = await obterTokenDePush();
  if (!token) return 'sem_permissao';
  try {
    await registerDevice({ push_token: token, platform: Platform.OS as 'ios' | 'android' });
    await gravarPreferencia(true);
    return 'ok';
  } catch {
    return 'falhou';
  }
}
