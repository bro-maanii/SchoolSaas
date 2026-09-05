import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { getModuleHandler, listModulesHandler, markViewedHandler } from "./training.controller";

// No tenantMiddleware/RBAC here on purpose — content is platform-wide (same
// for every school) and every role, including Teacher and Accountant, always
// has access per the plan's "Training Center: always in nav" rule.
export const trainingRouter = Router();

trainingRouter.use(authMiddleware);

trainingRouter.get("/modules", listModulesHandler);
trainingRouter.get("/modules/:slug", getModuleHandler);
trainingRouter.post("/items/:itemId/view", markViewedHandler);
