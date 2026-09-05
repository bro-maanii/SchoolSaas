import { z } from "zod";

const PERIOD_REGEX = /^\d{4}-\d{2}$/;

export const audienceFilterSchema = z.object({
  audienceType: z.enum(["ALL", "CLASS", "SECTION", "STUDENTS", "ABSENT_TODAY", "DEFAULTERS", "STAFF"]),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  period: z.string().regex(PERIOD_REGEX).optional(),
});

export const audiencePreviewQuerySchema = z.object({
  audienceType: z.enum(["ALL", "CLASS", "SECTION", "STUDENTS", "ABSENT_TODAY", "DEFAULTERS", "STAFF"]),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  studentIds: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
  period: z.string().regex(PERIOD_REGEX).optional(),
});

export const createBroadcastSchema = audienceFilterSchema
  .extend({
    templateId: z.string().optional(),
    rawBody: z.string().trim().min(1).max(1000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.audienceType === "CLASS" && !val.classId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "classId is required for a CLASS audience", path: ["classId"] });
    }
    if (val.audienceType === "SECTION" && !val.sectionId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "sectionId is required for a SECTION audience", path: ["sectionId"] });
    }
    if (val.audienceType === "STUDENTS" && (!val.studentIds || val.studentIds.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "studentIds is required for a STUDENTS audience", path: ["studentIds"] });
    }
    if (!val.templateId && !val.rawBody) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Either templateId or rawBody is required", path: ["rawBody"] });
    }
    if (val.templateId && val.rawBody) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide either a template or free text, not both", path: ["rawBody"] });
    }
  });

export const listBroadcastsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type AudiencePreviewQuery = z.infer<typeof audiencePreviewQuerySchema>;
export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
export type ListBroadcastsQuery = z.infer<typeof listBroadcastsQuerySchema>;
