import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateQuery } from "@/middleware/validate.middleware";
import {
  admissionsQuerySchema,
  alertsQuerySchema,
  attendanceByClassQuerySchema,
  feeTrendQuerySchema,
  summaryQuerySchema,
  todayCollectionsQuerySchema,
} from "./dashboard.validation";
import {
  getAdmissionsHandler,
  getAlertsHandler,
  getAttendanceByClassHandler,
  getClassStrengthHandler,
  getFeeTrendHandler,
  getSummaryHandler,
  getTodayCollectionsHandler,
} from "./dashboard.controller";

// The full multi-widget dashboard is Admin/Principal only. Accountant gets
// the fee-scoped summary + fee trend ("fee widgets only", per the
// permissions table). Teacher gets a role-scoped summary only (their own
// class's attendance) — handled inside the summary service, not a
// separate route.
const FULL_DASHBOARD_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL"];
const SUMMARY_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"];
const FEE_TREND_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT"];

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware, tenantMiddleware);

dashboardRouter.get(
  "/summary",
  requireRole(SUMMARY_ROLES),
  validateQuery(summaryQuerySchema),
  getSummaryHandler
);
dashboardRouter.get(
  "/fee-trend",
  requireRole(FEE_TREND_ROLES),
  validateQuery(feeTrendQuerySchema),
  getFeeTrendHandler
);
dashboardRouter.get(
  "/attendance-by-class",
  requireRole(FULL_DASHBOARD_ROLES),
  validateQuery(attendanceByClassQuerySchema),
  getAttendanceByClassHandler
);
dashboardRouter.get("/alerts", requireRole(FULL_DASHBOARD_ROLES), validateQuery(alertsQuerySchema), getAlertsHandler);
dashboardRouter.get(
  "/admissions",
  requireRole(FULL_DASHBOARD_ROLES),
  validateQuery(admissionsQuerySchema),
  getAdmissionsHandler
);
dashboardRouter.get("/class-strength", requireRole(FULL_DASHBOARD_ROLES), getClassStrengthHandler);
dashboardRouter.get(
  "/today-collections",
  requireRole(FEE_TREND_ROLES),
  validateQuery(todayCollectionsQuerySchema),
  getTodayCollectionsHandler
);
