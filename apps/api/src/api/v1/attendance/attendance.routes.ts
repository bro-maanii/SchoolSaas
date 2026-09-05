import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateBody, validateQuery } from "@/middleware/validate.middleware";
import {
  addHolidaySchema,
  correctAttendanceSchema,
  markAttendanceSchema,
  registerQuerySchema,
  rosterQuerySchema,
  weeklyOffDaysSchema,
} from "./attendance.validation";
import {
  addHolidayHandler,
  correctAttendanceHandler,
  getCalendarHandler,
  getRegisterHandler,
  getRosterHandler,
  getStudentHistoryHandler,
  markAttendanceHandler,
  removeHolidayHandler,
  sendAbsenceNotificationHandler,
  setWeeklyOffDaysHandler,
} from "./attendance.controller";

// Accountant has no role in Attendance at all per the permissions table.
const ALL_ATTENDANCE_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"];
// Principal is oversight/read-only — only Admin and Teacher write.
const WRITE_ROLES = ["SCHOOL_ADMIN", "TEACHER"];

export const attendanceRouter = Router();

attendanceRouter.use(authMiddleware, tenantMiddleware, requireRole(ALL_ATTENDANCE_ROLES));

attendanceRouter.get("/", validateQuery(rosterQuerySchema), getRosterHandler);
attendanceRouter.post("/", requireRole(WRITE_ROLES), validateBody(markAttendanceSchema), markAttendanceHandler);
attendanceRouter.patch(
  "/:id",
  requireRole(WRITE_ROLES),
  validateBody(correctAttendanceSchema),
  correctAttendanceHandler
);
attendanceRouter.post(
  "/:id/notify",
  requireRole(WRITE_ROLES),
  sendAbsenceNotificationHandler
);

attendanceRouter.get("/register", validateQuery(registerQuerySchema), getRegisterHandler);
attendanceRouter.get("/students/:studentId/history", getStudentHistoryHandler);

attendanceRouter.get("/calendar", getCalendarHandler);
attendanceRouter.post(
  "/calendar/holidays",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(addHolidaySchema),
  addHolidayHandler
);
attendanceRouter.delete("/calendar/holidays/:id", requireRole(["SCHOOL_ADMIN"]), removeHolidayHandler);
attendanceRouter.patch(
  "/calendar/weekly-off-days",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(weeklyOffDaysSchema),
  setWeeklyOffDaysHandler
);
