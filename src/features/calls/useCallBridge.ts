/**
 * useCallBridge — o ponto onde push (FCM/VoIP) e socket convergem na store de
 * chamada. Montado uma vez, alto na árvore (dentro do RootNavigator ou App),
 * enquanto houver sessão ativa.
 *
 * Por que os dois canais:
 *   - push  → toca a chamada com o app em background/fechado (CallKit/CallKeep).
 *   - socket→ reflete transições em tempo real com o app aberto e cobre os
 *             eventos "o outro lado desligou/atendeu em outro device".
 *
 * Ambos anunciam a MESMA chamada, então chegam eventos duplicados. A store já
 * trata transições inválidas como no-op (ex.: dois 'incoming' seguidos), então
 * a ponte pode repassar tudo sem deduplicar manualmente — a máquina de estados
 * é a única fonte de verdade.
 */
import { useEffect } from "react";
import { useSession } from "../../stores/session";
import { useCall } from "../../stores/call";
import { createSignalingSocket, SignalingSocket } from "../../api/signaling";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/** Formato normalizado de um push de chamada (após parse do data-message). */
export interface IncomingCallPush {
  type: "incoming_call" | "call_cancelled";
  callId: string;
  caller?: string;
  media?: "audio" | "video";
  room?: string;
}

export function useCallBridge() {
  const access = useSession((s) => s.access);
  const receiveIncoming = useCall((s) => s.receiveIncoming);
  const end = useCall((s) => s.end);

  useEffect(() => {
    if (!access) return;

    const socket: SignalingSocket = createSignalingSocket(BASE_URL, access);

    socket.on("call:incoming", (p) => {
      receiveIncoming({
        callId: p.callId,
        callerName: p.caller,
        media: p.media,
        room: p.room,
      });
    });

    // Qualquer terminação remota encerra a chamada local.
    const terminate = () => end();
    socket.on("call:declined", terminate);
    socket.on("call:ended", terminate);
    socket.on("call:missed", terminate);
    socket.on("call:cancelled", terminate);
    // 'call:answered' (atendida em outro device) também encerra este ring.
    socket.on("call:answered", terminate);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [access, receiveIncoming, end]);
}

/**
 * Handler de push, chamado pelo listener de notificações (ver
 * `src/push/usePushCallListener`). Traduz o data-message para a store.
 * Exportado à parte porque o push chega fora do ciclo de render do React
 * (inclusive com o app fechado).
 */
export function handleCallPush(push: IncomingCallPush) {
  const call = useCall.getState();
  if (push.type === "incoming_call" && push.caller && push.media && push.room) {
    call.receiveIncoming({
      callId: push.callId,
      callerName: push.caller,
      media: push.media,
      room: push.room,
    });
  } else if (push.type === "call_cancelled") {
    // "Cancelar" é PARAR DE TOCAR, não desligar. O servidor manda este push
    // para todos os aparelhos do morador quando um deles atende — inclusive
    // para o que atendeu. Aplicar fora do estado 'incoming' derrubaria a
    // chamada em curso no próprio aparelho que está falando com o entregador.
    const { phase, incoming } = useCall.getState();
    if (phase === "incoming" && incoming?.callId === push.callId) call.end();
  }
}
