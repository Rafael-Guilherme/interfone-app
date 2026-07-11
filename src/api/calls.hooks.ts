/**
 * Hooks de chamada — encapsulam os endpoints de calls da API.
 *
 * Fluxo de estado (cliente espelha servidor):
 *   iniciar/atender retornam { call, media } → a tela usa `media` (token+url)
 *   para entrar na sala LiveKit. Recusar/encerrar só transicionam estado.
 *
 * As mutations NÃO mexem na store de chamada diretamente — quem orquestra a
 * store é o container da tela + a ponte de eventos, para manter uma única fonte
 * de verdade das transições.
 */
import { useMutation } from '@tanstack/react-query';
import { api } from './index';
import type { CallMedia, CallMediaGrant } from '../types';

export function useStartCall(condoId: string) {
  return useMutation({
    mutationFn: (body: {
      callee_profile_id?: string;
      unit_id?: string;
      media: CallMedia;
    }) => api.post<CallMediaGrant>(`/condominiums/${condoId}/calls`, body),
  });
}

export function useAnswerCall() {
  return useMutation({
    mutationFn: (args: { callId: string; media: CallMedia }) =>
      api.post<CallMediaGrant>(`/calls/${args.callId}/answer`, {
        media: args.media,
      }),
  });
}

export function useDeclineCall() {
  return useMutation({
    mutationFn: (callId: string) =>
      api.post<void>(`/calls/${callId}/decline`),
  });
}

export function useEndCall() {
  return useMutation({
    mutationFn: (callId: string) => api.post<void>(`/calls/${callId}/end`),
  });
}
