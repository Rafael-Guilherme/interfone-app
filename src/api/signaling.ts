/**
 * Cliente Socket.IO de signaling, tipado. Espelha o SignalingGateway da API
 * (namespace /calls). NÃO transporta mídia — só eventos de estado, para o app
 * em primeiro plano reagir na hora, complementando o push (app em background).
 *
 * O token de auth vai no handshake; o WsAuthGuard do servidor resolve o usuário.
 */
import { io, Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  'call:incoming': (p: {
    callId: string;
    caller: string;
    media: 'audio' | 'video';
    room: string;
  }) => void;
  'call:answered': (p: { callId: string }) => void;
  'call:declined': (p: { callId: string }) => void;
  'call:ended': (p: { callId: string }) => void;
  'call:missed': (p: { callId: string }) => void;
  'call:cancelled': (p: { callId: string }) => void;
}

export interface ClientToServerEvents {
  'call:ready': (p: { callId: string }) => void;
}

export type SignalingSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export function createSignalingSocket(
  baseUrl: string,
  accessToken: string,
): SignalingSocket {
  return io(`${baseUrl}/calls`, {
    transports: ['websocket'],
    auth: { token: accessToken },
    autoConnect: true,
  });
}
