import { Router } from "express";
import { authRouter } from "./auth/auth.routes";
import { classesRouter } from "./classes/classes.routes";
import { studentsRouter } from "./students/students.routes";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/classes", classesRouter);
v1Router.use("/students", studentsRouter);
