import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateBody, validateQuery } from "@/middleware/validate.middleware";
import {
  createFeeCategorySchema,
  defaultersQuerySchema,
  generateInvoicesSchema,
  listInvoicesQuerySchema,
  recordPaymentSchema,
  setStructureAmountSchema,
  updateFeeCategorySchema,
} from "./fees.validation";
import {
  createCategoryHandler,
  generateInvoicesHandler,
  getDashboardHandler,
  getDefaultersHandler,
  getStudentLedgerHandler,
  listCategoriesHandler,
  listInvoicesHandler,
  listStructureHandler,
  recordPaymentHandler,
  sendFeeReminderHandler,
  setStructureAmountHandler,
  updateCategoryHandler,
} from "./fees.controller";

const READ_ROLES = ["SCHOOL_ADMIN", "ACCOUNTANT", "PRINCIPAL"];
const WRITE_ROLES = ["SCHOOL_ADMIN", "ACCOUNTANT"];

export const feesRouter = Router();

feesRouter.use(authMiddleware, tenantMiddleware, requireRole(READ_ROLES));

feesRouter.get("/dashboard", getDashboardHandler);
feesRouter.get("/defaulters", validateQuery(defaultersQuerySchema), getDefaultersHandler);

feesRouter.get("/categories", listCategoriesHandler);
feesRouter.post(
  "/categories",
  requireRole(WRITE_ROLES),
  validateBody(createFeeCategorySchema),
  createCategoryHandler
);
feesRouter.patch(
  "/categories/:id",
  requireRole(WRITE_ROLES),
  validateBody(updateFeeCategorySchema),
  updateCategoryHandler
);

feesRouter.get("/structure", listStructureHandler);
feesRouter.post(
  "/structure",
  requireRole(WRITE_ROLES),
  validateBody(setStructureAmountSchema),
  setStructureAmountHandler
);

feesRouter.post(
  "/invoices/generate",
  requireRole(WRITE_ROLES),
  validateBody(generateInvoicesSchema),
  generateInvoicesHandler
);
feesRouter.get("/invoices", validateQuery(listInvoicesQuerySchema), listInvoicesHandler);

feesRouter.get("/students/:studentId/ledger", getStudentLedgerHandler);
feesRouter.post("/invoices/:id/notify", requireRole(WRITE_ROLES), sendFeeReminderHandler);

feesRouter.post("/payments", requireRole(WRITE_ROLES), validateBody(recordPaymentSchema), recordPaymentHandler);
