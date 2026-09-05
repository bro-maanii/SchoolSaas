import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "@/lib/api/notifications";
import type { LogParams } from "@/lib/api/notifications";
import type { TriggerType } from "@/types/notifications";

export function useNotificationLog(params: LogParams) {
  return useQuery({
    queryKey: ["notifications", "log", params],
    queryFn: () => notificationsApi.getLog(params),
  });
}

export function useTemplates() {
  return useQuery({ queryKey: ["notifications", "templates"], queryFn: notificationsApi.listTemplates });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof notificationsApi.updateTemplate>[1] }) =>
      notificationsApi.updateTemplate(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "templates"] }),
  });
}

export function useNotificationRules() {
  return useQuery({ queryKey: ["notifications", "rules"], queryFn: notificationsApi.listRules });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      triggerType,
      input,
    }: {
      triggerType: TriggerType;
      input: Parameters<typeof notificationsApi.updateRule>[1];
    }) => notificationsApi.updateRule(triggerType, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "rules"] }),
  });
}
