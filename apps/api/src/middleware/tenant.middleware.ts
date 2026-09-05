import { NextFunction, Request, Response } from "express";
import { AppError } from "@/lib/app-error";

/**
 * Runs after authMiddleware. Requires a resolved school_id on every
 * tenant-scoped route except for Super Admin, who operates cross-tenant.
 * Never trust a client-supplied school_id in the request body/query —
 * always read req.auth.schoolId, set from the verified token/user record.
 */
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(AppError.unauthorized());
  }

  if (req.auth.role === "SUPER_ADMIN") {
    return next();
  }

  if (!req.auth.schoolId) {
    return next(AppError.forbidden("No school associated with this account"));
  }

  next();
}
