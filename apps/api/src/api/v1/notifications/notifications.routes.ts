import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateBody, validateQuery } from "@/middleware/validate.middleware";
import { logQuerySchema, updateRuleSchema, updateTemplateSchema } from "./notifications.validation";
import {
  getLogHandler,
  listRulesHandler,
  listTemplatesHandler,
  updateRuleHandler,
  updateTemplateHandler,
} from "./notifications.controller";

// Accountant is intentionally included here (scoped to fee-related entries
// only, enforced in the service) — everyone else who can view the log.
const LOG_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT"];

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware, tenantMiddleware);

notificationsRouter.get("/log", requireRole(LOG_ROLES), validateQuery(logQuerySchema), getLogHandler);

notificationsRouter.get("/templates", requireRole(["SCHOOL_ADMIN", "PRINCIPAL"]), listTemplatesHandler);
notificationsRouter.patch(
  "/templates/:id",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(updateTemplateSchema),
  updateTemplateHandler
);

notificationsRouter.get("/rules", requireRole(["SCHOOL_ADMIN"]), listRulesHandler);
notificationsRouter.patch(
  "/rules/:triggerType",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(updateRuleSchema),
  updateRuleHandler
);
