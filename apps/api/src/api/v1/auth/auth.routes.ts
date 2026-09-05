import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { loginSchema } from "./auth.validation";
import { loginHandler, refreshHandler, logoutHandler, meHandler } from "./auth.controller";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many login attempts, try again later" } },
});

export const authRouter = Router();

authRouter.post("/login", loginLimiter, validateBody(loginSchema), loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", authMiddleware, meHandler);
