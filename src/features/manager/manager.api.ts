import { api } from '../../api';
import { useActive } from '../../stores/active';

// ---------- tipos ----------
export interface CondoDetail {
  id: string;
  name: string;
  photo_url: string | null;
  join_code: string;
  slug: string;
  address: {
    street: string | null;
    number: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  };
  geo: { latitude: string; longitude: string; radius_m: number } | null;
  counts: { residents_active: number; residents_pending: number; blocks: number; units: number };
  qr_token: string | null;
}
export interface ResidentRow {
  profile_id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'blocked';
  units: string[];
}
export interface UnitRow { id: string; number: string; residents: number }
export interface BlockRow { id: string; name: string; units: UnitRow[] }
export interface Structure { has_blocks: boolean; blocks: BlockRow[]; units_no_block: UnitRow[] }
export interface Announcement { id: string; title: string; body: string; scope: string; block: string | null; reads: number; created_at: string }
export interface CommonArea { id: string; name: string; enabled: boolean; capacity: number | null; fee_cents: number | null; reservations: number }
export interface Reservation { id: string; resident: string; unit: string | null; starts_at: string; ends_at: string }
export interface QrCodeRow { id: string; label: string | null; token: string; active: boolean; used_count: number; unit: string | null; created_at: string }
export interface MineItem { profile_status: string; condominium: { id: string; name: string; slug: string; status: string } }
export interface LookupResult { id: string; name: string; units: { id: string; label: string }[] }

// ---------- painel / moradores ----------
export const getCondo = (id: string) => api.get<CondoDetail>(`/condominiums/${id}`);
export const listMine = () => api.get<MineItem[]>('/condominiums/mine');
export const getResidents = (id: string, status?: string) =>
  api.get<ResidentRow[]>(`/condominiums/${id}/residents${status ? `?status=${status}` : ''}`);
export const setResident = (id: string, pid: string, action: 'approve' | 'reject') =>
  api.patch<{ profile_id: string; status: string }>(`/condominiums/${id}/residents/${pid}`, { action });
export const updateCondo = (id: string, body: Record<string, unknown>) =>
  api.patch<{ id: string; name: string }>(`/condominiums/${id}`, body);

// ---------- estrutura ----------
export const getStructure = (id: string) => api.get<Structure>(`/condominiums/${id}/structure`);
export const createBlock = (id: string, name: string) => api.post<BlockRow>(`/condominiums/${id}/blocks`, { name });
export const updateBlock = (id: string, blockId: string, name: string) => api.patch(`/condominiums/${id}/blocks/${blockId}`, { name });
export const deleteBlock = (id: string, blockId: string) => api.delete(`/condominiums/${id}/blocks/${blockId}`);
export const createUnit = (id: string, number: string, block_id?: string) => api.post<UnitRow>(`/condominiums/${id}/units`, { number, block_id });
export const updateUnit = (id: string, unitId: string, number: string) => api.patch(`/condominiums/${id}/units/${unitId}`, { number });
export const deleteUnit = (id: string, unitId: string) => api.delete(`/condominiums/${id}/units/${unitId}`);

// ---------- comunicados ----------
export const listAnnouncements = (id: string) => api.get<Announcement[]>(`/condominiums/${id}/announcements`);
export const createAnnouncement = (id: string, body: { title: string; body: string; scope?: string; block_id?: string }) =>
  api.post<Announcement>(`/condominiums/${id}/announcements`, body);

// ---------- áreas comuns ----------
export interface AreaInput { name?: string; capacity?: number | null; fee_cents?: number | null; enabled?: boolean }
export const listAreas = (id: string) => api.get<CommonArea[]>(`/condominiums/${id}/common-areas`);
export const createArea = (id: string, body: AreaInput) => api.post<CommonArea>(`/condominiums/${id}/common-areas`, body);
export const updateArea = (id: string, areaId: string, body: AreaInput) =>
  api.patch<CommonArea>(`/condominiums/${id}/common-areas/${areaId}`, body);
export const deleteArea = (id: string, areaId: string) => api.delete(`/condominiums/${id}/common-areas/${areaId}`);
export const listReservations = (id: string, areaId: string) => api.get<Reservation[]>(`/condominiums/${id}/common-areas/${areaId}/reservations`);

// ---------- QR codes ----------
export const listQrs = (id: string) => api.get<QrCodeRow[]>(`/condominiums/${id}/qrcodes`);
export const createQr = (id: string, label?: string, unit_id?: string) => api.post<QrCodeRow>(`/condominiums/${id}/qrcodes`, { label, unit_id });
export const updateQr = (id: string, qrId: string, body: { label?: string; active?: boolean }) => api.patch<QrCodeRow>(`/condominiums/${id}/qrcodes/${qrId}`, body);
export const deleteQr = (id: string, qrId: string) => api.delete(`/condominiums/${id}/qrcodes/${qrId}`);

// ---------- morador (join) ----------
export const lookupByCode = (code: string) => api.get<LookupResult>(`/condominiums/lookup?code=${encodeURIComponent(code)}`);
export const join = (id: string, unit_id: string) => api.post<{ profile_id: string; status: string }>(`/condominiums/${id}/join`, { unit_id });
export const joinAsManager = (id: string) => api.post<{ profile_id: string; status: string; role: string }>(`/condominiums/${id}/join`, { as: 'manager' });

/** Condomínio ativo selecionado no seletor (contexto de síndico). */
export function useManagerCondo(): { condoId: string; condoName: string } | null {
  const condoId = useActive((s) => s.condoId);
  const condoName = useActive((s) => s.condoName);
  return condoId ? { condoId, condoName: condoName ?? '' } : null;
}
