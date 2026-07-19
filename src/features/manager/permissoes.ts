import { useActive } from '../../stores/active';
import { useSession } from '../../stores/session';

/**
 * Permissões do gestor ativo, espelhando `PERMISSOES` em
 * api/src/condominiums/manager-access.service.ts.
 *
 * Serve só para ESCONDER o que a API recusaria — a autorização de verdade
 * continua no servidor. Um sub-gestor que force a rota ainda leva 403.
 */
export type Permissao =
  | 'residents'
  | 'structure'
  | 'announcements'
  | 'areas'
  | 'packages'
  | 'qrcodes'
  | 'settings';

interface Acesso {
  /** true = gestor titular (role `manager`), que tem acesso a tudo. */
  titular: boolean;
  pode: (p: Permissao) => boolean;
}

export function useManagerAccess(): Acesso {
  const condoId = useActive((s) => s.condoId);
  const profiles = useSession((s) => s.profiles);

  const perfil = profiles.find(
    (p) => p.condominium.id === condoId && (p.role === 'manager' || p.role === 'sub_manager'),
  );
  const titular = perfil?.role === 'manager';
  const lista = perfil?.permissions ?? [];

  return {
    titular,
    // O titular ignora a lista (no banco ela vem vazia para ele).
    pode: (p) => titular || lista.includes(p),
  };
}
