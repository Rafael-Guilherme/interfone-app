/**
 * Camada de mídia da chamada — implementação BASE (web / fallback), no-op.
 *
 * O Metro resolve `callMedia.native.ts` no iOS/Android (LiveKit real via
 * @livekit/react-native) e este arquivo no web/Expo Web, onde os módulos nativos
 * de WebRTC não existem. Assim o app continua empacotando no web sem A/V.
 */
export interface CallMediaGrant {
  provider?: string; // 'livekit' | 'demo'
  token: string;
  url: string;
}

export interface CallMediaParams {
  grant: CallMediaGrant | null;
  active: boolean; // true enquanto a chamada está conectada (phase inCall)
  micOn: boolean;
  cameraOn: boolean;
}

export interface CallMediaState {
  connected: boolean;
  remoteVideoTrack: unknown | null;
  localVideoTrack: unknown | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCallMedia(_params: CallMediaParams): CallMediaState {
  return { connected: false, remoteVideoTrack: null, localVideoTrack: null };
}
