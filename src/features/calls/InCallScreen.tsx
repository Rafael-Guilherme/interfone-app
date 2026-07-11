/**
 * Em chamada (②·3) — UI de chamada ativa sobre superfície escura, não-descartável.
 * Controles: mute, alternar vídeo, encerrar; self-view em PIP.
 *
 * A sala LiveKit é montada a partir do grant (token+url) na store. O SDK real
 * (@livekit/react-native) entra na integração; aqui a estrutura de UI + a
 * fiação com a store e o encerramento estão completos. As áreas de vídeo são
 * placeholders até o SDK ser plugado (marcadas como tal).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../theme';
import { useCall } from '../../stores/call';
import { useCallMedia } from './media/callMedia';
import { VideoTile } from './media/VideoTile';

interface Props {
  /** Injetado pelo container: encerra na API e faz teardown da sala. */
  onEnd?: (callId: string | null) => Promise<void>;
}

export function InCallScreen({ onEnd }: Props) {
  const phase = useCall((s) => s.phase);
  const incoming = useCall((s) => s.incoming);
  const grant = useCall((s) => s.grant);
  const muted = useCall((s) => s.muted);
  const videoEnabled = useCall((s) => s.videoEnabled);
  const toggleMute = useCall((s) => s.toggleMute);
  const toggleVideo = useCall((s) => s.toggleVideo);
  const endStore = useCall((s) => s.end);
  const reset = useCall((s) => s.reset);

  const isConnecting = phase === 'connecting';

  // Mídia A/V real no nativo (LiveKit); no web é no-op (só sinalização).
  const media = useCallMedia({
    grant,
    active: phase === 'inCall',
    micOn: !muted,
    cameraOn: videoEnabled,
  });

  const handleEnd = async () => {
    endStore(); // -> 'ended' (UI reage)
    await onEnd?.(incoming?.callId ?? null);
    reset(); // volta a 'idle' após teardown
  };

  return (
    <View style={styles.container}>
      {/* Vídeo remoto (LiveKit no nativo; placeholder enquanto conecta / no web) */}
      <View style={styles.remote}>
        {media.remoteVideoTrack ? (
          <VideoTile track={media.remoteVideoTrack} style={StyleSheet.absoluteFillObject} />
        ) : grant && videoEnabled ? (
          <Text style={styles.remoteHint}>
            {media.connected ? 'aguardando vídeo…' : 'conectando mídia…'}
          </Text>
        ) : (
          <View style={styles.audioOnly}>
            <Text style={styles.caller}>{incoming?.callerName ?? 'Chamada'}</Text>
            <Text style={styles.status}>
              {isConnecting ? 'Conectando…' : 'Em chamada'}
            </Text>
          </View>
        )}
      </View>

      {/* Self-view PIP */}
      {videoEnabled ? (
        <View style={styles.pip}>
          {media.localVideoTrack ? (
            <VideoTile track={media.localVideoTrack} style={StyleSheet.absoluteFillObject} />
          ) : (
            <Text style={styles.pipHint}>você</Text>
          )}
        </View>
      ) : null}

      {/* Controles */}
      <View style={styles.controls}>
        <ControlButton
          label={muted ? 'Ativar' : 'Mudo'}
          active={muted}
          onPress={toggleMute}
        />
        <ControlButton
          label={videoEnabled ? 'Vídeo' : 'Vídeo off'}
          active={!videoEnabled}
          onPress={toggleVideo}
        />
        <Pressable style={[styles.ctrl, styles.endBtn]} onPress={handleEnd}>
          <Text style={styles.endText}>Encerrar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ControlButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.ctrl, active && styles.ctrlActive]}
      onPress={onPress}
    >
      <Text style={[styles.ctrlText, active && styles.ctrlTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  remote: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  remoteHint: { color: colors.textSecondary, fontSize: typography.size.md },
  audioOnly: { alignItems: 'center' },
  caller: {
    color: colors.textOnDark,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
  },
  status: { color: colors.textSecondary, fontSize: typography.size.md, marginTop: spacing.sm },
  pip: {
    position: 'absolute',
    top: spacing.xxl * 2,
    right: spacing.lg,
    width: 96,
    height: 140,
    borderRadius: radii.card,
    backgroundColor: colors.darkAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pipHint: { color: colors.textSecondary, fontSize: typography.size.xs },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    paddingTop: spacing.xl,
  },
  ctrl: {
    minWidth: 72,
    height: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.darkAlt,
  },
  ctrlActive: { backgroundColor: colors.textOnDark },
  ctrlText: { color: colors.textOnDark, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  ctrlTextActive: { color: colors.dark },
  endBtn: { backgroundColor: colors.error },
  endText: { color: colors.textOnAccent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
});
