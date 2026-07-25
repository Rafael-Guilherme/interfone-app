import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Fecha a aba do navegador e devolve o resultado ao app quando o OAuth termina.
WebBrowser.maybeCompleteAuthSession();

const IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
const ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;

/**
 * Sign-in com Google no app. Usa o fluxo de ID token: o Google devolve um
 * `id_token` que o backend (`POST /auth/google`) verifica. Não há client secret
 * no app — o segredo do OAuth nunca sai do servidor (e neste fluxo nem existe).
 *
 * `disponivel` é false quando os client IDs não estão configurados (placeholder
 * ou ausentes) — aí o botão nem aparece, em vez de abrir um fluxo que falharia.
 */
export function useGoogleSignIn(onIdToken: (idToken: string) => void, onErro?: (msg: string) => void) {
  const configurado = !!IOS && !IOS.startsWith('xxxx') && !!ANDROID && !ANDROID.startsWith('xxxx');

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: IOS,
    androidClientId: ANDROID,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? (response.authentication as any)?.idToken;
      if (idToken) onIdToken(idToken);
      else onErro?.('O Google não retornou o token de acesso.');
    } else if (response.type === 'error') {
      onErro?.('Não foi possível entrar com o Google.');
    }
    // 'dismiss'/'cancel' = usuário fechou; sem erro.
  }, [response]);

  return {
    disponivel: configurado && !!request,
    entrar: () => promptAsync(),
  };
}
