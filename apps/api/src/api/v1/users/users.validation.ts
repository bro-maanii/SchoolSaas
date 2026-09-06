import { z } from "zod";

// A School Admin can create/edit staff accounts only — never another School
// Admin or a Super Admin. That boundary is enforced by this enum, not just by RBAC.
export const STAFF_ROLES = ["PRINCIPAL", "ACCOUNTANT", "TEACHER"] as const;

const assignmentSchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
});

export const createUserSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    role: z.enum(STAFF_ROLES),
    assignments: z.array(assignmentSchema).max(20).optional(),
  })
  .refine((d) => d.role === "TEACHER" || !d.assignments?.length, {
    message: "Only Teacher accounts can have class assignments",
    path: ["assignments"],
  });

// All fields optional — a partial update. Whether `assignments` is honored
// depends on the *effective* role (existing role, unless this same request
// also changes it), which the schema alone can't know — that check happens
// in the service.
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  assignments: z.array(assignmentSchema).max(20).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
