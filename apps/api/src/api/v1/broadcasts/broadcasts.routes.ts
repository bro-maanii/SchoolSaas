import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateBody, validateQuery } from "@/middleware/validate.middleware";
import { audiencePreviewQuerySchema, createBroadcastSchema, listBroadcastsQuerySchema } from "./broadcasts.validation";
import {
  createBroadcastHandler,
  getBroadcastHandler,
  listBroadcastsHandler,
  previewAudienceHandler,
} from "./broadcasts.controller";

// Accountant is included but restricted to a DEFAULTERS audience, enforced
// in the service (fee-related broadcasts only, per the permissions table).
const ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT"];

export const broadcastsRouter = Router();

broadcastsRouter.use(authMiddleware, tenantMiddleware, requireRole(ROLES));

broadcastsRouter.get("/audience-preview", validateQuery(audiencePreviewQuerySchema), previewAudienceHandler);
broadcastsRouter.post("/", validateBody(createBroadcastSchema), createBroadcastHandler);
broadcastsRouter.get("/", validateQuery(listBroadcastsQuerySchema), listBroadcastsHandler);
broadcastsRouter.get("/:id", getBroadcastHandler);
