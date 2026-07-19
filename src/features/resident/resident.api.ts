import { api } from '../../api';
import { useActive } from '../../stores/active';

export interface Area { id: string; name: string; capacity: number | null; fee_cents: number | null; max_days_ahead: number | null }

/** Status de cada dia no calendário da área (ver api/src/common-areas/calendar.ts). */
export type DayStatus = 'livre' | 'bloqueado' | 'ocupado' | 'meu' | 'pendente' | 'administracao' | 'fora_janela';
export interface DiaCalendario { day: string; status: DayStatus; reason?: string | null }
export interface AreaCalendar { area: { id: string; name: string; max_days_ahead: number | null }; days: DiaCalendario[] }
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

export interface MyPackage {
  id: string;
  unidade: string;
  descricao: string;
  destinatario: string | null;
  transportadora: string | null;
  status: 'waiting' | 'picked_up';
  recebida_em: string;
  retirada_em: string | null;
}

const base = (id: string) => `/condominiums/${id}/resident`;

/** Contato interno do condomínio (portaria, zelador…). */
export interface Contato { id: string; name: string; phone: string; note: string | null; }
export const getContatos = (id: string) => api.get<Contato[]>(`${base(id)}/contacts`);

export const getAreas = (id: string) => api.get<Area[]>(`${base(id)}/areas`);
export const getAreaCalendar = (id: string, areaId: string) =>
  api.get<AreaCalendar>(`${base(id)}/areas/${areaId}/calendar`);
/** A reserva é pelo dia inteiro: manda só a data (YYYY-MM-DD). */
export const createReservation = (id: string, common_area_id: string, day: string) =>
  api.post<MyReservation>(`${base(id)}/reservations`, { common_area_id, day });
export const myReservations = (id: string) => api.get<MyReservation[]>(`${base(id)}/reservations`);
export const cancelReservation = (id: string, resId: string) => api.delete(`${base(id)}/reservations/${resId}`);

export const getFeed = (id: string) => api.get<FeedItem[]>(`${base(id)}/feed`);
export const markRead = (id: string, annId: string) => api.post(`${base(id)}/feed/${annId}/read`);

export const getRecados = (id: string) => api.get<Recado[]>(`${base(id)}/recados`);

export const getCallHistory = (id: string) => api.get<CallLog[]>(`${base(id)}/calls`);

export interface QueueMember {
  profile_id: string;
  nome: string;
  sou_eu: boolean;
  ordem: number;
  na_fila: boolean;
}
export interface UnitQueue {
  unit_id: string;
  unidade: string;
  posso_editar: boolean;
  moradores: QueueMember[];
}

export const getCallQueue = (id: string) => api.get<UnitQueue[]>(`${base(id)}/call-queue`);
export const setCallQueue = (
  id: string,
  unit_id: string,
  entradas: { profile_id: string; na_fila: boolean }[],
) => api.patch(`${base(id)}/call-queue`, { unit_id, entradas });

export const getMyPackages = (id: string) => api.get<MyPackage[]>(`${base(id)}/packages`);
export const pickupMyPackage = (id: string, pkgId: string) =>
  api.patch(`${base(id)}/packages/${pkgId}/pickup`, {});

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
