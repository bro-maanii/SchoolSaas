import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { validateQuery } from "@/middleware/validate.middleware";
import { searchQuerySchema } from "./search.validation";
import { searchHandler } from "./search.controller";

export const searchRouter = Router();

searchRouter.use(authMiddleware, tenantMiddleware);
searchRouter.get("/", validateQuery(searchQuerySchema), searchHandler);
