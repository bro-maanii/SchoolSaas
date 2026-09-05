import { Request, Response, NextFunction } from "express";
import { AppError } from "@/lib/app-error";
import * as studentsService from "./students.service";
import { CSV_TEMPLATE_COLUMNS, parseCsv } from "./students.import";

export function csvTemplateHandler(req: Request, res: Response) {
  const header = CSV_TEMPLATE_COLUMNS.join(",");
  const example = [
    "101",
    "Ahmed Khan",
    "2015-03-12",
    "Male",
    "Class 5",
    "A",
    "Bilal Khan",
    "Father",
    "+923001234567",
    "true",
  ].join(",");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="student-import-template.csv"');
  res.send(`${header}\n${example}\n`);
}

export async function importPreviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw AppError.badRequest("A CSV file is required");
    }
    const rows = parseCsv(req.file.buffer);
    if (rows.length === 0) {
      throw AppError.badRequest("The CSV file has no data rows");
    }
    if (rows.length > 1000) {
      throw AppError.badRequest("CSV files are limited to 1000 rows per import");
    }
    const result = await studentsService.previewImport(req.auth!.schoolId!, rows);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function importCommitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      throw AppError.badRequest("No rows to import");
    }
    const result = await studentsService.commitImport(req.auth!.schoolId!, rows);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
