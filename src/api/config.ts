import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve a URL base da API de forma robusta em cada ambiente — a causa nº 1 de
 * "o app não conecta na API" é usar `localhost`, que no emulador/device aponta
 * para o próprio aparelho, não para a sua máquina.
 *
 * Ordem de resolução:
 *   1. EXPO_PUBLIC_API_URL (override explícito — use no APK/device: o IP/domínio da API).
 *   2. host do servidor Metro (em dev, o Expo já sabe o IP da sua máquina) + porta 3000.
 *   3. Emulador Android sem host detectável → 10.0.2.2 (alias do host no emulador).
 *   4. Fallback localhost (iOS simulator / web).
 */
const API_PORT = 3000;

function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Ex.: "192.168.0.12:8081" (dev server). Cobre os diferentes campos por SDK.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    '';
  const host = String(hostUri).split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}`;
  }
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`; // emulador Android
  return `http://localhost:${API_PORT}`; // iOS simulator / web
}

export const API_URL = resolveApiUrl();

/**
 * URL base do front web (entregador). É o destino dos links/QR compartilhados,
 * então nunca pode ser `localhost` num aparelho real.
 *   1. EXPO_PUBLIC_WEB_URL (override explícito — obrigatório no build de produção).
 *   2. host do servidor Metro + porta do Vite (dev na LAN).
 *   3. Fallback localhost (iOS simulator / web).
 */
const WEB_PORT = 5173;

function resolveWebUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_WEB_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    '';
  const host = String(hostUri).split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${WEB_PORT}`;
  }
  return `http://localhost:${WEB_PORT}`;
}

export const WEB_URL = resolveWebUrl();

/** Link público do QR (o web aceita `/?t=<token>`). */
export const qrLink = (token: string) => `${WEB_URL}/?t=${token}`;
