import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from "@/lib/api/dashboard";
import type { DashboardFilters } from "@/lib/api/dashboard";
import { useAuthStore } from "@/store/auth-store";

export function useDashboardSummary(params: DashboardFilters) {
  // The response shape differs by role (Teacher/Accountant/Admin each get a
  // different summary), so role is part of the cache identity — otherwise a
  // role-mismatched cache hit from a previous session could render before its
  // own request resolves. Belt-and-braces alongside clearing the query cache
  // on logout (see Topbar).
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ["dashboard", "summary", role, params],
    queryFn: () => dashboardApi.getSummary(params),
    enabled: !!role,
  });
}

export function useAttendanceByClass(params: DashboardFilters, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "attendance-by-class", params],
    queryFn: () => dashboardApi.getAttendanceByClass(params),
    enabled,
  });
}

export function useFeeTrend(params: { months?: number; classId?: string }, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "fee-trend", params],
    queryFn: () => dashboardApi.getFeeTrend(params),
    enabled,
  });
}

export function useDashboardAlerts(params: { classId?: string }, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "alerts", params],
    queryFn: () => dashboardApi.getAlerts(params),
    enabled,
  });
}

export function useAdmissions(params: DashboardFilters, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "admissions", params],
    queryFn: () => dashboardApi.getAdmissions(params),
    enabled,
  });
}

export function useClassStrength(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "class-strength"],
    queryFn: dashboardApi.getClassStrength,
    enabled,
  });
}
