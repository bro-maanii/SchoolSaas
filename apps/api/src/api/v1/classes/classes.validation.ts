import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(50),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  orderIndex: z.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
});

export const createSectionSchema = z.object({
  name: z.string().trim().min(1).max(20),
});

export const updateSectionSchema = z.object({
  name: z.string().trim().min(1).max(20).optional(),
  isArchived: z.boolean().optional(),
});

export const listClassesQuerySchema = z.object({
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
