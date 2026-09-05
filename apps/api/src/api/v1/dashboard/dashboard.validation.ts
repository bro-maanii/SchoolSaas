import { z } from "zod";

const PERIOD_REGEX = /^\d{4}-\d{2}$/;

export const summaryQuerySchema = z.object({
  month: z.string().regex(PERIOD_REGEX).optional(),
  classId: z.string().optional(),
});

export const attendanceByClassQuerySchema = z.object({
  month: z.string().regex(PERIOD_REGEX).optional(),
  classId: z.string().optional(),
});

export const feeTrendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(6),
  classId: z.string().optional(),
});

export const alertsQuerySchema = z.object({
  classId: z.string().optional(),
});

export const admissionsQuerySchema = z.object({
  month: z.string().regex(PERIOD_REGEX).optional(),
  classId: z.string().optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type AttendanceByClassQuery = z.infer<typeof attendanceByClassQuerySchema>;
export type FeeTrendQuery = z.infer<typeof feeTrendQuerySchema>;
export type AlertsQuery = z.infer<typeof alertsQuerySchema>;
export type AdmissionsQuery = z.infer<typeof admissionsQuerySchema>;
