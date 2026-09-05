import { api } from "@/lib/api-client";
import type { SearchResult } from "@/types/search";

export function search(q: string) {
  return api.get<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`);
}
