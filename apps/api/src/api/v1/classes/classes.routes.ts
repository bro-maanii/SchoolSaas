import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateBody, validateQuery } from "@/middleware/validate.middleware";
import {
  createClassSchema,
  createSectionSchema,
  listClassesQuerySchema,
  updateClassSchema,
  updateSectionSchema,
} from "./classes.validation";
import {
  createClassHandler,
  createSectionHandler,
  listClassesHandler,
  updateClassHandler,
  updateSectionHandler,
} from "./classes.controller";

export const classesRouter = Router();

classesRouter.use(authMiddleware, tenantMiddleware);

classesRouter.get("/", validateQuery(listClassesQuerySchema), listClassesHandler);
classesRouter.post("/", requireRole(["SCHOOL_ADMIN"]), validateBody(createClassSchema), createClassHandler);
classesRouter.patch("/:id", requireRole(["SCHOOL_ADMIN"]), validateBody(updateClassSchema), updateClassHandler);

classesRouter.post(
  "/:id/sections",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(createSectionSchema),
  createSectionHandler
);
classesRouter.patch(
  "/:id/sections/:sectionId",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(updateSectionSchema),
  updateSectionHandler
);
