import { Router } from "express";
import { authRouter } from "./auth/auth.routes";
import { classesRouter } from "./classes/classes.routes";
import { studentsRouter } from "./students/students.routes";
import { feesRouter } from "./fees/fees.routes";
import { attendanceRouter } from "./attendance/attendance.routes";
import { notificationsRouter } from "./notifications/notifications.routes";
import { broadcastsRouter } from "./broadcasts/broadcasts.routes";
import { dashboardRouter } from "./dashboard/dashboard.routes";
import { trainingRouter } from "./training/training.routes";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/classes", classesRouter);
v1Router.use("/students", studentsRouter);
v1Router.use("/fees", feesRouter);
v1Router.use("/attendance", attendanceRouter);
v1Router.use("/notifications", notificationsRouter);
v1Router.use("/broadcasts", broadcastsRouter);
v1Router.use("/dashboard", dashboardRouter);
v1Router.use("/training", trainingRouter);
