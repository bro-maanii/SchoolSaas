import { z } from "zod";

export const createFeeCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  type: z.enum(["MONTHLY", "ANNUAL", "ADMISSION", "OTHER"]),
  isRecurring: z.boolean().optional(),
});

export const updateFeeCategorySchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  isRecurring: z.boolean().optional(),
});

export const setStructureAmountSchema = z.object({
  classId: z.string().min(1),
  feeCategoryId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

const PERIOD_REGEX = /^\d{4}-\d{2}$/;

export const generateInvoicesSchema = z.object({
  period: z
    .string()
    .regex(PERIOD_REGEX, "Period must be in YYYY-MM format")
    .optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "BANK", "OTHER"]),
});

export const listInvoicesQuerySchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  period: z.string().regex(PERIOD_REGEX).optional(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const defaultersQuerySchema = z.object({
  period: z.string().regex(PERIOD_REGEX).optional(),
  classId: z.string().optional(),
});

export const dashboardQuerySchema = z.object({
  period: z.string().regex(PERIOD_REGEX).optional(),
});

export type CreateFeeCategoryInput = z.infer<typeof createFeeCategorySchema>;
export type UpdateFeeCategoryInput = z.infer<typeof updateFeeCategorySchema>;
export type SetStructureAmountInput = z.infer<typeof setStructureAmountSchema>;
export type GenerateInvoicesInput = z.infer<typeof generateInvoicesSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
export type DefaultersQuery = z.infer<typeof defaultersQuerySchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
