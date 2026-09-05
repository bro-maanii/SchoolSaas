import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as broadcastsApi from "@/lib/api/broadcasts";
import type { AudienceFilters } from "@/lib/api/broadcasts";
import type { AudienceType } from "@/types/broadcasts";

export function useAudiencePreview(audienceType: AudienceType, filters: AudienceFilters, enabled = true) {
  return useQuery({
    queryKey: ["broadcasts", "audience-preview", audienceType, filters],
    queryFn: () => broadcastsApi.previewAudience(audienceType, filters),
    enabled,
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: broadcastsApi.createBroadcast,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["broadcasts", "list"] }),
  });
}

export function useBroadcastHistory(params: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["broadcasts", "list", params],
    queryFn: () => broadcastsApi.listBroadcasts(params),
  });
}

export function useBroadcastDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["broadcasts", "detail", id],
    queryFn: () => broadcastsApi.getBroadcast(id!),
    enabled: !!id,
  });
}
