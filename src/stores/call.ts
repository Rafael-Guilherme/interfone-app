import { create } from 'zustand';

/**
 * Máquina de estados da chamada no cliente — espelha o servidor.
 *
 *   idle → incoming → connecting → inCall → ended → idle
 *              └────────── (decline/miss/cancel) ──────────┘
 *
 * As telas (IncomingCallScreen, InCallScreen) são puras e dirigidas por este
 * store; a rede (socket) vive nos hooks. Transições inválidas viram no-op, então
 * eventos duplicados de push+socket são seguros (uma única fonte de verdade).
 */
export type CallPhase = 'idle' | 'incoming' | 'connecting' | 'inCall' | 'ended';
export type CallMedia = 'audio' | 'video';

export interface IncomingCall {
  callId: string;
  callerName?: string;
  media?: CallMedia;
  room?: string;
}

export interface MediaGrant {
  token: string;
  url: string;
}

interface CallState {
  phase: CallPhase;
  incoming: IncomingCall | null;
  grant: MediaGrant | null;
  muted: boolean;
  videoEnabled: boolean;

  receiveIncoming: (call: IncomingCall) => void;
  answer: () => void;
  connected: (grant: MediaGrant) => void;
  decline: () => void;
  end: () => void;
  reset: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

export const useCall = create<CallState>((set, get) => ({
  phase: 'idle',
  incoming: null,
  grant: null,
  muted: false,
  videoEnabled: false,

  receiveIncoming: (call) => {
    if (get().phase !== 'idle') return; // já em chamada → ignora
    set({
      phase: 'incoming',
      incoming: call,
      videoEnabled: call.media === 'video',
    });
  },

  answer: () => {
    if (get().phase !== 'incoming') return;
    set({ phase: 'connecting' });
  },

  connected: (grant) => {
    if (get().phase !== 'connecting') return;
    set({ phase: 'inCall', grant });
  },

  decline: () => set({ phase: 'ended' }),

  end: () => {
    const { phase } = get();
    if (phase === 'idle' || phase === 'ended') return;
    set({ phase: 'ended' });
  },

  reset: () =>
    set({
      phase: 'idle',
      incoming: null,
      grant: null,
      muted: false,
      videoEnabled: false,
    }),

  toggleMute: () => set((s) => ({ muted: !s.muted })),
  toggleVideo: () => set((s) => ({ videoEnabled: !s.videoEnabled })),
}));
