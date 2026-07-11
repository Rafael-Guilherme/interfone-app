/**
 * Containers de chamada — ligam as telas (puras, dirigidas pela store) aos hooks
 * de API. Ficam finos de propósito: a máquina de estados vive na store, a rede
 * vive nos hooks, e o container só costura os dois nos momentos de transição.
 *
 * Transições orquestradas aqui:
 *   - atender: answer() na store (ringing→connecting) já rodou na tela; aqui
 *     chamamos a API, e ao receber o grant fazemos connected() (connecting→inCall).
 *   - encerrar: end na API + reset da store após teardown.
 */
import React from 'react';
import { useCall } from '../../stores/call';
import { useAnswerCall, useDeclineCall, useEndCall } from '../../api/calls.hooks';
import { IncomingCallScreen } from './IncomingCallScreen';
import { InCallScreen } from './InCallScreen';

export function IncomingCallContainer() {
  const incoming = useCall((s) => s.incoming);
  const connected = useCall((s) => s.connected);
  const reset = useCall((s) => s.reset);

  const answer = useAnswerCall();
  const decline = useDeclineCall();

  const onAccept = async (callId: string) => {
    try {
      const grant = await answer.mutateAsync({
        callId,
        media: incoming?.media ?? 'audio',
      });
      // token chegou → entra na sala (connecting → inCall)
      connected({ token: grant.media.token, url: grant.media.url });
    } catch {
      reset(); // falhou ao atender → volta a ocioso
    }
  };

  const onDecline = async (callId: string) => {
    try {
      await decline.mutateAsync(callId);
    } finally {
      // a store já transiciona no decline() da tela; nada a fazer aqui.
    }
  };

  return <IncomingCallScreen onAccept={onAccept} onDecline={onDecline} />;
}

export function InCallContainer() {
  const end = useEndCall();

  const onEnd = async (callId: string | null) => {
    if (!callId) return;
    try {
      await end.mutateAsync(callId);
    } catch {
      // encerramento é best-effort; a store já saiu de inCall.
    }
    // teardown da sala LiveKit (room.disconnect()) entra aqui na integração.
  };

  return <InCallScreen onEnd={onEnd} />;
}
