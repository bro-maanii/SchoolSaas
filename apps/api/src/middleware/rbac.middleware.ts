import { NextFunction, Request, Response } from "express";
import { AppError } from "@/lib/app-error";

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return next(AppError.forbidden());
    }
    next();
  };
}
