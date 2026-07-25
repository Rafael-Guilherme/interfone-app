/**
 * Registro do aparelho para push.
 *
 * Roda uma vez por sessão, alto na árvore (junto do useCallBridge): pede a
 * permissão, obtém o token da Expo e manda para a API, que passa a poder tocar
 * a chamada com o app em segundo plano ou fechado.
 *
 * O token é guardado no módulo (`ultimoToken`) para que o logout consiga
 * desregistrar o aparelho — sem isso, o celular continuaria recebendo as
 * chamadas do morador que saiu.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSession } from '../stores/session';
import { registerDevice, unregisterDevice } from './push.api';

/** Canal do Android usado pela chamada: importância máxima, toca e vibra. */
export const CANAL_CHAMADAS = 'calls';

let ultimoToken: string | null = null;

async function prepararCanais() {
  if (Platform.OS !== 'android') return;
  // No Android o canal é quem define som, vibração e se a notificação aparece
  // na tela de bloqueio — a prioridade do envio sozinha não basta.
  await Notifications.setNotificationChannelAsync(CANAL_CHAMADAS, {
    name: 'Chamadas do interfone',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 250, 400],
    lightColor: '#FF0000',
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Avisos e encomendas',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Pede permissão e devolve o token do aparelho — `null` se não der para registrar. */
export async function obterTokenDePush(): Promise<string | null> {
  await prepararCanais();

  // Emulador/simulador não recebe push; no Expo Web também não há token nativo.
  if (!Device.isDevice || Platform.OS === 'web') return null;

  const { status: atual } = await Notifications.getPermissionsAsync();
  const status = atual === 'granted' ? atual : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    // Falta de google-services.json, build sem credencial de push, etc.
    // Não é fatal: o socket continua entregando com o app aberto.
    return null;
  }
}

export function usePushRegistration() {
  const access = useSession((s) => s.access);

  useEffect(() => {
    if (!access) return;
    let cancelado = false;

    void (async () => {
      const token = await obterTokenDePush();
      if (!token || cancelado) return;
      ultimoToken = token;
      try {
        await registerDevice({ push_token: token, platform: Platform.OS as 'ios' | 'android' });
      } catch {
        // Rede caiu ou API fora: tenta de novo na próxima abertura do app.
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [access]);
}

/**
 * Desfaz o registro. Chamado no logout, ANTES de limpar a sessão — a requisição
 * precisa do access token que está prestes a ser descartado.
 */
export async function desregistrarAparelho() {
  if (!ultimoToken) return;
  try {
    await unregisterDevice(ultimoToken);
  } catch {
    // Sem rede o registro fica órfão no servidor; ele cai sozinho quando a Expo
    // devolver DeviceNotRegistered, ou no próximo login deste aparelho.
  }
  ultimoToken = null;
}
