import { api } from "@/lib/api-client";
import type { TrainingModuleDetail, TrainingModuleSummary } from "@/types/training";

export function listModules() {
  return api.get<TrainingModuleSummary[]>("/training/modules");
}

export function getModule(slug: string) {
  return api.get<TrainingModuleDetail>(`/training/modules/${slug}`);
}

export function markItemViewed(itemId: string) {
  return api.post<{ ok: boolean }>(`/training/items/${itemId}/view`);
}
