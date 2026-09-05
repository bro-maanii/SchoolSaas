import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(DATE_REGEX, "Date must be in YYYY-MM-DD format");

export const rosterQuerySchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  date: dateField.optional(),
});

export const markAttendanceSchema = z.object({
  date: dateField,
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]),
      })
    )
    .min(1, "At least one student record is required"),
});

export const correctAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]),
});

export const registerQuerySchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  from: dateField,
  to: dateField,
});

export const addHolidaySchema = z.object({
  date: dateField,
  label: z.string().trim().max(100).optional(),
});

export const weeklyOffDaysSchema = z.object({
  days: z.array(z.number().int().min(0).max(6)).max(7),
});

export type RosterQuery = z.infer<typeof rosterQuerySchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type CorrectAttendanceInput = z.infer<typeof correctAttendanceSchema>;
export type RegisterQuery = z.infer<typeof registerQuerySchema>;
export type AddHolidayInput = z.infer<typeof addHolidaySchema>;
export type WeeklyOffDaysInput = z.infer<typeof weeklyOffDaysSchema>;
