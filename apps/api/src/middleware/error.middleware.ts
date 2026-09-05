import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request", details: err.flatten() },
    });
  }

  if (err instanceof MulterError) {
    return res.status(400).json({ error: { code: "UPLOAD_ERROR", message: err.message } });
  }

  // multer's fileFilter rejects by passing a plain Error, not a MulterError
  if (err instanceof Error && err.message === "Only .csv files are accepted") {
    return res.status(400).json({ error: { code: "UPLOAD_ERROR", message: err.message } });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    } else {
      logger.info({ code: err.code, path: req.path }, err.message);
    }
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}
