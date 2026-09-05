import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as feesApi from "@/lib/api/fees";
import type { ListInvoicesParams } from "@/lib/api/fees";

export function useFeeCategories() {
  return useQuery({ queryKey: ["fees", "categories"], queryFn: feesApi.listFeeCategories });
}

export function useCreateFeeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feesApi.createFeeCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fees", "categories"] }),
  });
}

export function useUpdateFeeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof feesApi.updateFeeCategory>[1] }) =>
      feesApi.updateFeeCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fees", "categories"] }),
  });
}

export function useFeeStructure() {
  return useQuery({ queryKey: ["fees", "structure"], queryFn: feesApi.getStructure });
}

export function useSetStructureAmount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feesApi.setStructureAmount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fees", "structure"] }),
  });
}

export function useGenerateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feesApi.generateInvoices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["fees", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["fees", "defaulters"] });
    },
  });
}

export function useInvoices(params: ListInvoicesParams) {
  return useQuery({
    queryKey: ["fees", "invoices", params],
    queryFn: () => feesApi.listInvoices(params),
  });
}

export function useStudentLedger(studentId: string | undefined) {
  return useQuery({
    queryKey: ["fees", "ledger", studentId],
    queryFn: () => feesApi.getStudentLedger(studentId!),
    enabled: !!studentId,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feesApi.recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    },
  });
}

export function useSendFeeReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feesApi.sendFeeReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDefaulters(params: { period?: string; classId?: string }) {
  return useQuery({
    queryKey: ["fees", "defaulters", params],
    queryFn: () => feesApi.getDefaulters(params),
  });
}

export function useFeeDashboard(period?: string) {
  return useQuery({
    queryKey: ["fees", "dashboard", period],
    queryFn: () => feesApi.getFeeDashboard(period),
  });
}
