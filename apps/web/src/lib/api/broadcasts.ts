import { api, apiRequestWithMeta } from "@/lib/api-client";
import type { AudiencePreview, AudienceType, BroadcastDetail, BroadcastListRow, CreateBroadcastResult } from "@/types/broadcasts";

export type AudienceFilters = {
  classId?: string;
  sectionId?: string;
  studentIds?: string[];
  period?: string;
};

export function previewAudience(audienceType: AudienceType, filters: AudienceFilters) {
  const search = new URLSearchParams({ audienceType });
  if (filters.classId) search.set("classId", filters.classId);
  if (filters.sectionId) search.set("sectionId", filters.sectionId);
  if (filters.studentIds?.length) search.set("studentIds", filters.studentIds.join(","));
  if (filters.period) search.set("period", filters.period);
  return api.get<AudiencePreview>(`/broadcasts/audience-preview?${search.toString()}`);
}

export function createBroadcast(input: {
  audienceType: AudienceType;
  classId?: string;
  sectionId?: string;
  studentIds?: string[];
  period?: string;
  templateId?: string;
  rawBody?: string;
}) {
  return api.post<CreateBroadcastResult>("/broadcasts", input);
}

export function listBroadcasts(params: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return apiRequestWithMeta<BroadcastListRow[], { total: number; page: number; pageSize: number }>(
    `/broadcasts${qs ? `?${qs}` : ""}`,
    { method: "GET" }
  );
}

export function getBroadcast(id: string) {
  return api.get<BroadcastDetail>(`/broadcasts/${id}`);
}
