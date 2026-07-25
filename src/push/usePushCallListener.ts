/**
 * Recebimento do push de chamada.
 *
 * O socket (useCallBridge) só entrega enquanto o app está vivo; é este listener
 * que traz a chamada quando o app estava em segundo plano ou fechado. Os dois
 * canais anunciam a MESMA chamada e chegam duplicados de propósito — a máquina
 * de estados em `stores/call` trata o segundo evento como no-op.
 *
 * Três entradas, porque o Android/iOS entregam de formas diferentes conforme o
 * estado do app:
 *   1. recebido com o app aberto           → addNotificationReceivedListener
 *   2. usuário tocou na notificação        → addNotificationResponseReceivedListener
 *   3. app foi ABERTO pelo toque (estava fechado) → getLastNotificationResponseAsync
 */
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { handleCallPush, IncomingCallPush } from '../features/calls/useCallBridge';
import { useCall } from '../stores/call';
import { useSession } from '../stores/session';

/**
 * Como apresentar a notificação. A chamada é desenhada pelo app
 * (IncomingCallScreen), então com o app aberto o banner só atrapalharia — mas
 * com o app em segundo plano ele é o único aviso que o usuário tem.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Partial<IncomingCallPush>;
    const emPrimeiroPlano = useCall.getState().phase !== 'idle';
    const cancelamento = data?.type === 'call_cancelled';
    return {
      shouldShowAlert: !cancelamento && !emPrimeiroPlano,
      shouldPlaySound: !cancelamento && !emPrimeiroPlano,
      shouldSetBadge: false,
    };
  },
});

/** Extrai o payload da chamada; `null` para notificações que não são de chamada. */
function lerPayload(content: Notifications.NotificationContent): IncomingCallPush | null {
  const data = content.data as Partial<IncomingCallPush> | undefined;
  if (!data?.callId) return null;
  if (data.type !== 'incoming_call' && data.type !== 'call_cancelled') return null;
  return data as IncomingCallPush;
}

export function usePushCallListener() {
  const access = useSession((s) => s.access);

  useEffect(() => {
    // Sem sessão a chamada não teria como ser atendida (o socket precisa do
    // token), então ignoramos o push até o login.
    if (!access) return;

    const recebido = Notifications.addNotificationReceivedListener((n) => {
      const payload = lerPayload(n.request.content);
      if (payload) handleCallPush(payload);
    });

    const tocado = Notifications.addNotificationResponseReceivedListener((r) => {
      const payload = lerPayload(r.notification.request.content);
      if (payload) handleCallPush(payload);
    });

    // App aberto a partir da notificação: o evento acima já passou antes do
    // listener existir, então o estado inicial vem daqui.
    void Notifications.getLastNotificationResponseAsync().then((r) => {
      if (!r) return;
      const payload = lerPayload(r.notification.request.content);
      // Só faz sentido restaurar um toque; uma chamada já cancelada, não.
      if (payload?.type === 'incoming_call') handleCallPush(payload);
    });

    return () => {
      recebido.remove();
      tocado.remove();
    };
  }, [access]);
}
