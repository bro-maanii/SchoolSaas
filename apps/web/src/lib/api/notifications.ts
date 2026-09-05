import { api, apiRequestWithMeta } from "@/lib/api-client";
import type { MessageTemplate, NotificationLogRow, NotificationRule, TriggerType } from "@/types/notifications";

export type LogParams = {
  triggerType?: TriggerType;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export function getLog(params: LogParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && search.set(k, String(v)));
  const qs = search.toString();
  return apiRequestWithMeta<NotificationLogRow[], { total: number; page: number; pageSize: number }>(
    `/notifications/log${qs ? `?${qs}` : ""}`,
    { method: "GET" }
  );
}

export function listTemplates() {
  return api.get<MessageTemplate[]>("/notifications/templates");
}

export function updateTemplate(id: string, input: { name?: string; bodyText?: string }) {
  return api.patch<MessageTemplate>(`/notifications/templates/${id}`, input);
}

export function listRules() {
  return api.get<NotificationRule[]>("/notifications/rules");
}

export function updateRule(
  triggerType: TriggerType,
  input: { isEnabled?: boolean; commsWindowStart?: string; commsWindowEnd?: string }
) {
  return api.patch<NotificationRule>(`/notifications/rules/${triggerType}`, input);
}
