import React from 'react';
import type { ViewStyle } from 'react-native';
import type { VideoTrack } from 'livekit-client';

/**
 * Renderiza uma track de vídeo do LiveKit (iOS/Android). O `VideoView` vem do
 * módulo nativo; carregado de forma defensiva para não quebrar em ambientes sem
 * WebRTC nativo (Expo Go). Sem o módulo, ou sem track, renderiza nada.
 */
let VideoView: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VideoView = require('@livekit/react-native').VideoView;
} catch {
  VideoView = null;
}

export function VideoTile({ track, style }: { track: unknown | null; style?: ViewStyle }) {
  if (!track || !VideoView) return null;
  const V = VideoView;
  return <V videoTrack={track as VideoTrack} style={style} objectFit="cover" />;
}
