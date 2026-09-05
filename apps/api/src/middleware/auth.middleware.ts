import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/lib/config";
import { AppError } from "@/lib/app-error";
import { prisma } from "@/lib/prisma";

export interface AuthTokenPayload {
  userId: string;
  schoolId: string | null;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing bearer token"));
  }

  const token = header.slice("Bearer ".length);

  let payload: AuthTokenPayload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
  } catch {
    return next(AppError.unauthorized("Invalid or expired token"));
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status !== "ACTIVE") {
    return next(AppError.unauthorized("Account is inactive"));
  }

  req.auth = { userId: user.id, schoolId: user.schoolId, role: user.role };
  next();
}
