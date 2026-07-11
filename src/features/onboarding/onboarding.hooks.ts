/**
 * Hooks de onboarding — encapsulam as chamadas de API em mutations/queries do
 * TanStack Query, para as telas ① consumirem sem tocar no client diretamente.
 *
 * Padrão que os demais fluxos seguem: um arquivo de hooks por feature, o client
 * injetado via `api`, e o refetch de /me disparado quando o estado do servidor
 * muda (aqui, após join, para o RootNavigator recalcular a árvore).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CondoBlock,
  JoinCondoBody,
  JoinCondoResponse,
  RequestOtpBody,
  RequestOtpResponse,
  ResolveCondoResponse,
  VerifyOtpBody,
  VerifyOtpResponse,
} from "./onboarding.types";
import { useSession } from "../../stores/session";
import { api } from "../../api";
import { Me } from "../../types";

/** Passo 2 — pede o código OTP por e-mail. */
export function useRequestOtp() {
  return useMutation({
    mutationFn: (body: RequestOtpBody) =>
      api.post<RequestOtpResponse>("/auth/otp/request", body),
  });
}

/** Passo 3 — verifica o OTP, guarda tokens e carrega /me. */
export function useVerifyOtp() {
  const setTokens = useSession((s) => s.setTokens);
  const setMe = useSession((s) => s.setMe);

  return useMutation({
    mutationFn: (body: VerifyOtpBody) =>
      api.post<VerifyOtpResponse>("/auth/otp/verify", body),
    onSuccess: async (tokens) => {
      setTokens(tokens);
      // com o token já ativo, busca o perfil (pode vir sem nenhum profile ainda)
      const me = await api.get<Me>("/me");
      setMe(me);
    },
  });
}

/** Passo 4/5 — resolve o código do condomínio para o card de confirmação. */
export function useResolveCondo(joinCode: string | null) {
  return useQuery({
    queryKey: ["resolve-condo", joinCode],
    enabled: !!joinCode,
    queryFn: () =>
      api.get<ResolveCondoResponse>(
        `/condominiums/resolve/${encodeURIComponent(joinCode as string)}`,
      ),
  });
}

/** Passo 6 — blocos e unidades do condo, para os seletores. */
export function useCondoBlocks(condoId: string | null) {
  return useQuery({
    queryKey: ["condo-blocks", condoId],
    enabled: !!condoId,
    queryFn: () => api.get<CondoBlock[]>(`/condominiums/${condoId}/blocks`),
  });
}

/** Passo 7 — cria o Profile (pending). Refaz /me para o gate reagir. */
export function useJoinCondo() {
  const qc = useQueryClient();
  const setMe = useSession((s) => s.setMe);
  const setActiveProfile = useSession((s) => s.setActiveProfile);

  return useMutation({
    mutationFn: (body: JoinCondoBody) =>
      api.post<JoinCondoResponse>("/join", body),
    onSuccess: async (res) => {
      const me = await api.get<Me>("/me");
      setMe(me);
      setActiveProfile(res.profile_id); // já foca o perfil recém-criado (pending)
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
