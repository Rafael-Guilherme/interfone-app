import { api } from '../../api';
import { useActive } from '../../stores/active';

export interface Area { id: string; name: string; capacity: number | null; fee_cents: number | null }
export interface MyReservation { id: string; area: string; starts_at: string; ends_at: string; status: string }
export interface FeedItem { id: string; title: string; body: string; created_at: string; read: boolean }
export interface Recado { kind: 'message' | 'call'; id: string; from: string; text: string; at: string }
export interface MyQr { id: string; label: string | null; token: string; validity_mode: string; valid_until: string | null; usage_mode: string; used_count: number; expired: boolean }

export interface CallLog {
  id: string;
  from: string;
  unit: string | null;
  media: 'audio' | 'video';
  status: 'ringing' | 'answered' | 'missed' | 'declined' | 'ended';
  started_at: string;
  duration_s: number | null;
}

const base = (id: string) => `/condominiums/${id}/resident`;

export const getAreas = (id: string) => api.get<Area[]>(`${base(id)}/areas`);
export const createReservation = (id: string, common_area_id: string, starts_at: string, ends_at: string) =>
  api.post<MyReservation>(`${base(id)}/reservations`, { common_area_id, starts_at, ends_at });
export const myReservations = (id: string) => api.get<MyReservation[]>(`${base(id)}/reservations`);
export const cancelReservation = (id: string, resId: string) => api.delete(`${base(id)}/reservations/${resId}`);

export const getFeed = (id: string) => api.get<FeedItem[]>(`${base(id)}/feed`);
export const markRead = (id: string, annId: string) => api.post(`${base(id)}/feed/${annId}/read`);

export const getRecados = (id: string) => api.get<Recado[]>(`${base(id)}/recados`);

export const getCallHistory = (id: string) => api.get<CallLog[]>(`${base(id)}/calls`);

export const getMyQrs = (id: string) => api.get<MyQr[]>(`${base(id)}/qrcodes`);
export const createMyQr = (id: string, body: { label: string; validity_mode?: string; valid_until?: string; usage_mode?: string }) =>
  api.post<{ id: string; label: string; token: string }>(`${base(id)}/qrcodes`, body);
export const deleteMyQr = (id: string, qrId: string) => api.delete(`${base(id)}/qrcodes/${qrId}`);

/** Condomínio do morador ativo selecionado no seletor. */
export function useResidentCondo(): { condoId: string; condoName: string } | null {
  const condoId = useActive((s) => s.condoId);
  const condoName = useActive((s) => s.condoName);
  return condoId ? { condoId, condoName: condoName ?? '' } : null;
}
