import { prisma } from "./prisma";

/** Normalizes any Date/string to a UTC midnight Date matching how @db.Date columns compare. */
export function toDateOnly(input: string | Date): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Returns { isSchoolDay, reason } — the Mark Attendance screen shouldn't render a roster otherwise. */
export async function checkSchoolDay(
  schoolId: string,
  date: Date
): Promise<{ isSchoolDay: true } | { isSchoolDay: false; reason: string }> {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { weeklyOffDays: true } });
  const dayOfWeek = date.getUTCDay();

  if (school?.weeklyOffDays.includes(dayOfWeek)) {
    return { isSchoolDay: false, reason: "Weekly off day" };
  }

  const holiday = await prisma.schoolCalendarDay.findUnique({
    where: { schoolId_date: { schoolId, date } },
  });
  if (holiday) {
    return { isSchoolDay: false, reason: holiday.label ?? "Holiday" };
  }

  return { isSchoolDay: true };
}
