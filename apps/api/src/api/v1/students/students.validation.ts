import { z } from "zod";
import { E164_REGEX } from "@/lib/phone";

export const guardianInputSchema = z.object({
  fullName: z.string().trim().min(1, "Guardian name is required").max(100),
  relationship: z.enum(["FATHER", "MOTHER", "OTHER"]),
  phoneE164: z
    .string()
    .trim()
    .regex(E164_REGEX, "Phone must be in E.164 format, e.g. +923001234567"),
  whatsappOptIn: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

const guardiansArraySchema = z
  .array(guardianInputSchema)
  .min(1, "At least one guardian is required")
  .max(4)
  .superRefine((guardians, ctx) => {
    const primaryCount = guardians.filter((g) => g.isPrimary).length;
    if (primaryCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one guardian must be marked as primary",
        path: [0, "isPrimary"],
      });
    } else if (primaryCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one guardian can be marked as primary",
        path: [],
      });
    }
    const phones = guardians.map((g) => g.phoneE164);
    if (new Set(phones).size !== phones.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Guardian phone numbers must be unique",
        path: [],
      });
    }
  });

export const createStudentSchema = z.object({
  rollNumber: z.string().trim().min(1, "Roll number is required").max(20),
  fullName: z.string().trim().min(1, "Student name is required").max(100),
  dob: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  admissionDate: z.coerce.date().optional(),
  guardians: guardiansArraySchema,
});

export const updateStudentSchema = z.object({
  rollNumber: z.string().trim().min(1).max(20).optional(),
  fullName: z.string().trim().min(1).max(100).optional(),
  dob: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  classId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED"]).optional(),
  guardians: guardiansArraySchema.optional(),
});

export const listStudentsQuerySchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED"]).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type GuardianInput = z.infer<typeof guardianInputSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
