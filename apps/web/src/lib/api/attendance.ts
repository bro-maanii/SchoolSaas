import { api } from "@/lib/api-client";
import type {
  AttendanceStatus,
  CalendarResponse,
  RegisterResponse,
  RosterResponse,
  SendNotificationResult,
} from "@/types/attendance";

export function getRoster(params: { classId: string; sectionId: string; date?: string }) {
  const search = new URLSearchParams({ classId: params.classId, sectionId: params.sectionId });
  if (params.date) search.set("date", params.date);
  return api.get<RosterResponse>(`/attendance?${search.toString()}`);
}

export function markAttendance(input: {
  date: string;
  classId: string;
  sectionId: string;
  records: { studentId: string; status: AttendanceStatus }[];
}) {
  return api.post<{ date: string; marked: number }>("/attendance", input);
}

export function correctAttendance(id: string, status: AttendanceStatus) {
  return api.patch(`/attendance/${id}`, { status });
}

export function getRegister(params: { classId?: string; sectionId?: string; from: string; to: string }) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && search.set(k, v));
  return api.get<RegisterResponse>(`/attendance/register?${search.toString()}`);
}

export function getStudentAttendanceHistory(studentId: string) {
  return api.get<
    { id: string; date: string; status: AttendanceStatus; correctedAt: string | null; notification: import("@/types/attendance").NotificationInfo }[]
  >(`/attendance/students/${studentId}/history`);
}

export function getCalendar() {
  return api.get<CalendarResponse>("/attendance/calendar");
}

export function addHoliday(input: { date: string; label?: string }) {
  return api.post("/attendance/calendar/holidays", input);
}

export function removeHoliday(id: string) {
  return api.delete(`/attendance/calendar/holidays/${id}`);
}

export function setWeeklyOffDays(days: number[]) {
  return api.patch("/attendance/calendar/weekly-off-days", { days });
}

export function sendAbsenceNotification(attendanceRecordId: string) {
  return api.post<SendNotificationResult>(`/attendance/${attendanceRecordId}/notify`);
}
