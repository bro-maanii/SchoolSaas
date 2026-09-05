import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as trainingApi from "@/lib/api/training";

export function useTrainingModules() {
  return useQuery({ queryKey: ["training", "modules"], queryFn: trainingApi.listModules });
}

export function useTrainingModule(slug: string) {
  return useQuery({
    queryKey: ["training", "module", slug],
    queryFn: () => trainingApi.getModule(slug),
    enabled: !!slug,
  });
}

export function useMarkItemViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trainingApi.markItemViewed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training"] });
    },
  });
}
