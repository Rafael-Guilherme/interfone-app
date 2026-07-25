import { api } from '../api';

export interface DeviceRegistration {
  push_token: string;
  platform: 'ios' | 'android';
  voip_token?: string;
}

/** Registra o aparelho para receber chamadas. Idempotente: pode repetir a cada abertura. */
export const registerDevice = (body: DeviceRegistration) =>
  api.post<{ ok: boolean }>('/me/devices', body);

/** Remove o aparelho no logout — senão ele continua tocando as chamadas de quem saiu. */
export const unregisterDevice = (push_token: string) =>
  api.delete<{ ok: boolean }>('/me/devices', { push_token });
