import { api } from '../../api';
import { useSession } from '../../stores/session';

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

export const getCondo = (id: string) => api.get<CondoDetail>(`/condominiums/${id}`);

export const getResidents = (id: string, status?: string) =>
  api.get<ResidentRow[]>(`/condominiums/${id}/residents${status ? `?status=${status}` : ''}`);

export const setResident = (id: string, pid: string, action: 'approve' | 'reject') =>
  api.patch<{ profile_id: string; status: string }>(`/condominiums/${id}/residents/${pid}`, { action });

/** Condomínio do síndico ativo na sessão (primeiro perfil manager ativo). */
export function useManagerCondo(): { condoId: string; condoName: string } | null {
  const profiles = useSession((s) => s.profiles);
  const mgr = profiles.find(
    (p) => (p.role === 'manager' || p.role === 'sub_manager') && p.status === 'active',
  );
  return mgr ? { condoId: mgr.condominium.id, condoName: mgr.condominium.name } : null;
}
