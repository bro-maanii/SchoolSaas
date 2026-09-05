import { Request, Response, NextFunction } from "express";
import * as studentsService from "./students.service";

export async function listStudentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await studentsService.listStudents(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof studentsService.listStudents>[1],
      req.auth!.role,
      req.auth!.userId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.getStudentById(
      req.auth!.schoolId!,
      req.params.id,
      req.auth!.role,
      req.auth!.userId
    );
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
}

export async function createStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.createStudent(req.auth!.schoolId!, req.body);
    res.status(201).json({ data: student });
  } catch (err) {
    next(err);
  }
}

export async function updateStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.updateStudent(req.auth!.schoolId!, req.params.id, req.body);
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
}

export async function deactivateStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await studentsService.deactivateStudent(req.auth!.schoolId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
