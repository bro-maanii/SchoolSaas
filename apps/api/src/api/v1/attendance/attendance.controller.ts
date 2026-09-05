import { Request, Response, NextFunction } from "express";
import * as attendanceService from "./attendance.service";

export async function getRosterHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.getRoster(
      req.auth!.schoolId!,
      req.auth!.role,
      req.auth!.userId,
      req.query as unknown as Parameters<typeof attendanceService.getRoster>[3]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function markAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.markAttendance(
      req.auth!.schoolId!,
      req.auth!.userId,
      req.auth!.role,
      req.body
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function correctAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await attendanceService.correctAttendanceRecord(
      req.auth!.schoolId!,
      req.auth!.userId,
      req.auth!.role,
      req.params.id,
      req.body
    );
    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

export async function getRegisterHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.getRegister(
      req.auth!.schoolId!,
      req.auth!.role,
      req.auth!.userId,
      req.query as unknown as Parameters<typeof attendanceService.getRegister>[3]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getStudentHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.getStudentAttendanceHistory(
      req.auth!.schoolId!,
      req.auth!.role,
      req.auth!.userId,
      req.params.studentId
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCalendarHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.getCalendar(req.auth!.schoolId!);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function addHolidayHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const holiday = await attendanceService.addHoliday(req.auth!.schoolId!, req.body);
    res.status(201).json({ data: holiday });
  } catch (err) {
    next(err);
  }
}

export async function removeHolidayHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await attendanceService.removeHoliday(req.auth!.schoolId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function setWeeklyOffDaysHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.setWeeklyOffDays(req.auth!.schoolId!, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function sendAbsenceNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.sendAbsenceNotification(
      req.auth!.schoolId!,
      req.auth!.userId,
      req.params.id
    );
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}
