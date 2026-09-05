import { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Fire-and-forget audit trail for mutating requests. Services that need a
 * richer diff/metadata snapshot (e.g. fee edits) should write their own
 * AuditLog row directly instead of relying on this generic capture.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  res.on("finish", () => {
    if (!req.auth || res.statusCode >= 400) return;

    prisma.auditLog
      .create({
        data: {
          schoolId: req.auth.schoolId,
          userId: req.auth.userId,
          action: `${req.method} ${req.baseUrl}${req.path}`,
          entityType: req.baseUrl.split("/").pop() ?? "unknown",
          entityId: (req.params as Record<string, string>).id ?? null,
          metadata: { body: req.body },
        },
      })
      .catch((err) => logger.error({ err }, "Failed to write audit log"));
  });

  next();
}
