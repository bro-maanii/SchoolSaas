import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from "./users.validation";
import {
  createUserHandler,
  deleteUserHandler,
  listUsersHandler,
  updateUserHandler,
  updateUserStatusHandler,
} from "./users.controller";

// Principal gets read-only visibility into the staff list (per the plan's
// permissions table); only School Admin can create, edit, deactivate, or
// delete accounts.
const READ_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL"];

export const usersRouter = Router();

usersRouter.use(authMiddleware, tenantMiddleware);

usersRouter.get("/", requireRole(READ_ROLES), listUsersHandler);
usersRouter.post("/", requireRole(["SCHOOL_ADMIN"]), validateBody(createUserSchema), createUserHandler);
usersRouter.patch("/:id", requireRole(["SCHOOL_ADMIN"]), validateBody(updateUserSchema), updateUserHandler);
usersRouter.patch(
  "/:id/status",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(updateUserStatusSchema),
  updateUserStatusHandler
);
usersRouter.delete("/:id", requireRole(["SCHOOL_ADMIN"]), deleteUserHandler);
