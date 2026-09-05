import { z } from "zod";

export const logQuerySchema = z.object({
  triggerType: z.enum(["ABSENCE", "FEE_REMINDER", "FEE_OVERDUE"]).optional(),
  status: z.enum(["QUEUED", "SENT", "DELIVERED", "READ", "FAILED"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  bodyText: z.string().trim().min(1).max(1000).optional(),
});

export const updateRuleSchema = z.object({
  isEnabled: z.boolean().optional(),
  commsWindowStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:MM (24-hour)")
    .optional(),
  commsWindowEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:MM (24-hour)")
    .optional(),
});

export type LogQuery = z.infer<typeof logQuerySchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
