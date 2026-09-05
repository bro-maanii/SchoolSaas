import { api } from "@/lib/api-client";
import type {
  AdmissionsResponse,
  ClassAttendanceRow,
  ClassStrengthRow,
  DashboardAlert,
  DashboardSummary,
  FeeTrendPoint,
} from "@/types/dashboard";

export type DashboardFilters = { month?: string; classId?: string };

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getSummary(params: DashboardFilters) {
  return api.get<DashboardSummary>(`/dashboard/summary${buildQuery(params)}`);
}

export function getAttendanceByClass(params: DashboardFilters) {
  return api.get<ClassAttendanceRow[]>(`/dashboard/attendance-by-class${buildQuery(params)}`);
}

export function getFeeTrend(params: { months?: number; classId?: string }) {
  return api.get<FeeTrendPoint[]>(`/dashboard/fee-trend${buildQuery(params)}`);
}

export function getAlerts(params: { classId?: string }) {
  return api.get<DashboardAlert[]>(`/dashboard/alerts${buildQuery(params)}`);
}

export function getAdmissions(params: DashboardFilters) {
  return api.get<AdmissionsResponse>(`/dashboard/admissions${buildQuery(params)}`);
}

export function getClassStrength() {
  return api.get<ClassStrengthRow[]>("/dashboard/class-strength");
}
