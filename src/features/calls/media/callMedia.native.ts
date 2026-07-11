import { useEffect, useRef, useState } from 'react';
import type { Room as RoomType, RemoteTrack } from 'livekit-client';
import type { CallMediaParams, CallMediaState } from './callMedia';

/**
 * Mídia A/V real no app (iOS/Android) via LiveKit. Requer o módulo NATIVO de
 * WebRTC — que só existe num **dev build / APK** (prebuild + compilação nativa),
 * NÃO no Expo Go nem em JS puro.
 *
 * Por isso o carregamento é defensivo: se o WebRTC nativo não estiver presente,
 * a mídia se desativa silenciosamente e o app segue funcionando só com a
 * sinalização (tocar/atender/encerrar). A/V liga automaticamente quando rodar
 * num build nativo. Ver docs/BUILD_APK.md.
 */
let lk: typeof import('@livekit/react-native') | null = null;
let lkClient: typeof import('livekit-client') | null = null;
let webrtcReady = false;

try {
  // require (não import estático) para o erro de módulo nativo ausente ser
  // capturado aqui, em vez de derrubar o app na inicialização.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  lk = require('@livekit/react-native');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  lkClient = require('livekit-client');
  lk!.registerGlobals();
  webrtcReady = true;
} catch (e) {
  console.warn(
    '[callMedia] WebRTC nativo indisponível — mídia A/V desativada. ' +
      'Rode num dev build/APK para ter áudio/vídeo (docs/BUILD_APK.md).',
    (e as Error)?.message,
  );
}

export function useCallMedia({ grant, active, micOn, cameraOn }: CallMediaParams): CallMediaState {
  const roomRef = useRef<RoomType | null>(null);
  const [connected, setConnected] = useState(false);
  const [remoteVideoTrack, setRemote] = useState<unknown | null>(null);
  const [localVideoTrack, setLocal] = useState<unknown | null>(null);

  useEffect(() => {
    if (!webrtcReady || !lk || !lkClient) return; // Expo Go / sem módulo nativo
    if (!active || !grant || grant.provider !== 'livekit') return;

    const { Room, RoomEvent, Track } = lkClient;
    const { AudioSession } = lk;
    let cancelled = false;
    const room = new Room({ adaptiveStream: true });
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind === 'video') setRemote(track);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      if (track.kind === 'video')
        setRemote((cur: unknown) => (cur === track ? null : cur));
    });

    (async () => {
      await AudioSession.startAudioSession();
      await room.connect(grant.url, grant.token);
      if (cancelled) return;
      await room.localParticipant.setMicrophoneEnabled(micOn);
      if (cameraOn) await room.localParticipant.setCameraEnabled(true);
      setLocal(room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack ?? null);
      setConnected(true);
    })().catch(() => setConnected(false));

    return () => {
      cancelled = true;
      void room.disconnect();
      void lk!.AudioSession.stopAudioSession();
      roomRef.current = null;
      setConnected(false);
      setRemote(null);
      setLocal(null);
    };
  }, [active, grant?.token]);

  // Sincroniza mudo/câmera com os controles da tela.
  useEffect(() => {
    void roomRef.current?.localParticipant.setMicrophoneEnabled(micOn);
  }, [micOn]);

  useEffect(() => {
    const lp = roomRef.current?.localParticipant;
    if (!lp || !lkClient) return;
    const cameraSource = lkClient.Track.Source.Camera;
    void lp.setCameraEnabled(cameraOn).then(() => {
      setLocal(lp.getTrackPublication(cameraSource)?.videoTrack ?? null);
    });
  }, [cameraOn]);

  return { connected, remoteVideoTrack, localVideoTrack };
}
