import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from '../../stores/session';
import { useCall } from '../../stores/call';
import { API_URL } from '../../api/config';

/**
 * Ponte de chamada do MORADOR. Conecta ao namespace /calls como `resident` com o
 * JWT da sessão; o servidor deriva as unidades e o coloca nas salas. Dirige o
 * store de chamada a partir dos eventos de signaling. A base da API é resolvida
 * por plataforma em api/config.ts (emulador/device/web).
 */
export function useResidentCall() {
  const access = useSession((s) => s.access);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!access) return;

    // O servidor deriva as unidades do morador do JWT e o coloca nas salas.
    const socket = io(`${API_URL}/calls`, {
      transports: ['websocket'],
      auth: { role: 'resident', token: access },
    });
    socketRef.current = socket;

    const call = useCall.getState;

    socket.on('call:incoming', (p) =>
      call().receiveIncoming({
        callId: p.callId,
        callerName: p.caller,
        media: p.media,
        room: p.room,
      }),
    );
    // Terminações remotas (o outro lado desligou, timeout, ou atendida noutro device).
    socket.on('call:cancelled', () => call().end());
    socket.on('call:declined', () => call().end());
    socket.on('call:ended', () => call().end());
    socket.on('call:missed', () => call().end());

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [access]);

  /** Atende: transiciona o store e pede o grant de mídia ao servidor. */
  const answer = () => {
    const { incoming, answer: toConnecting, connected, reset } = useCall.getState();
    const socket = socketRef.current;
    if (!incoming || !socket) return;
    toConnecting(); // incoming → connecting
    socket.emit(
      'call:answer',
      { callId: incoming.callId },
      (ack: { ok: boolean; grant?: { token: string; url: string } }) => {
        if (ack?.ok && ack.grant) connected({ token: ack.grant.token, url: ack.grant.url });
        else reset();
      },
    );
  };

  const decline = () => {
    const { incoming, decline: declineStore } = useCall.getState();
    if (!incoming) return;
    declineStore();
    socketRef.current?.emit('call:decline', { callId: incoming.callId });
  };

  const end = () => {
    const { incoming } = useCall.getState();
    if (incoming) socketRef.current?.emit('call:end', { callId: incoming.callId });
  };

  return { answer, decline, end };
}
