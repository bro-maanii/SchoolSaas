import { api, apiRequestWithMeta } from "@/lib/api-client";
import type {
  AcademicYear,
  DefaulterRow,
  FeeCategory,
  FeeCategoryType,
  FeeDashboardSummary,
  FeeStructureItem,
  Invoice,
  PaymentMethod,
} from "@/types/fees";

export function listFeeCategories() {
  return api.get<FeeCategory[]>("/fees/categories");
}

export function createFeeCategory(input: { name: string; type: FeeCategoryType; isRecurring?: boolean }) {
  return api.post<FeeCategory>("/fees/categories", input);
}

export function updateFeeCategory(id: string, input: { name?: string; isRecurring?: boolean }) {
  return api.patch<FeeCategory>(`/fees/categories/${id}`, input);
}

export function getStructure() {
  return api.get<{ academicYear: AcademicYear; items: FeeStructureItem[] }>("/fees/structure");
}

export function setStructureAmount(input: { classId: string; feeCategoryId: string; amount: number }) {
  return api.post<FeeStructureItem>("/fees/structure", input);
}

export function generateInvoices(period?: string) {
  return api.post<{ period: string; created: number }>("/fees/invoices/generate", { period });
}

export type ListInvoicesParams = {
  studentId?: string;
  classId?: string;
  period?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export function listInvoices(params: ListInvoicesParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return apiRequestWithMeta<Invoice[], { total: number; page: number; pageSize: number }>(
    `/fees/invoices${qs ? `?${qs}` : ""}`,
    { method: "GET" }
  );
}

export function getStudentLedger(studentId: string) {
  return api.get<Invoice[]>(`/fees/students/${studentId}/ledger`);
}

export function recordPayment(input: { invoiceId: string; amount: number; method: PaymentMethod }) {
  return api.post<Invoice>("/fees/payments", input);
}

export type SendFeeReminderResult = {
  jobId: string;
  deliveryId: string;
  status: string;
  sentAt: string;
  recipientPhone: string;
  messageText: string;
  triggerType: "FEE_REMINDER" | "FEE_OVERDUE";
};

export function sendFeeReminder(invoiceId: string) {
  return api.post<SendFeeReminderResult>(`/fees/invoices/${invoiceId}/notify`);
}

export function getDefaulters(params: { period?: string; classId?: string } = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const qs = search.toString();
  return api.get<DefaulterRow[]>(`/fees/defaulters${qs ? `?${qs}` : ""}`);
}

export function getFeeDashboard(period?: string) {
  return api.get<FeeDashboardSummary>(`/fees/dashboard${period ? `?period=${period}` : ""}`);
}
