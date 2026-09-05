import { Request, Response, NextFunction } from "express";
import * as classesService from "./classes.service";

export async function listClassesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const includeArchived = (req.query.includeArchived as unknown as boolean) ?? false;
    const classes = await classesService.listClasses(req.auth!.schoolId!, includeArchived);
    res.json({ data: classes });
  } catch (err) {
    next(err);
  }
}

export async function createClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cls = await classesService.createClass(req.auth!.schoolId!, req.body);
    res.status(201).json({ data: cls });
  } catch (err) {
    next(err);
  }
}

export async function updateClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cls = await classesService.updateClass(req.auth!.schoolId!, req.params.id, req.body);
    res.json({ data: cls });
  } catch (err) {
    next(err);
  }
}

export async function createSectionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const section = await classesService.createSection(req.auth!.schoolId!, req.params.id, req.body);
    res.status(201).json({ data: section });
  } catch (err) {
    next(err);
  }
}

export async function updateSectionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const section = await classesService.updateSection(
      req.auth!.schoolId!,
      req.params.id,
      req.params.sectionId,
      req.body
    );
    res.json({ data: section });
  } catch (err) {
    next(err);
  }
}
