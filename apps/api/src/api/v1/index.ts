import { Router } from "express";
import { authRouter } from "./auth/auth.routes";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
