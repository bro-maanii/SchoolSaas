import { Request, Response, NextFunction } from "express";
import * as dashboardService from "./dashboard.service";

export async function getSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getSummary(
      req.auth!.schoolId!,
      req.auth!.role,
      req.auth!.userId,
      req.query as unknown as Parameters<typeof dashboardService.getSummary>[3]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceByClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getAttendanceByClass(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof dashboardService.getAttendanceByClass>[1]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getFeeTrendHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getFeeTrend(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof dashboardService.getFeeTrend>[1]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getAlertsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getAlerts(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof dashboardService.getAlerts>[1]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getAdmissionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getAdmissions(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof dashboardService.getAdmissions>[1]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getClassStrengthHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getClassStrength(req.auth!.schoolId!);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
