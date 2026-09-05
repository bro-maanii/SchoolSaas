export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

export type NotificationInfo = {
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  sentAt: string;
} | null;

export type RosterStudent = {
  id: string;
  fullName: string;
  rollNumber: string;
  status: AttendanceStatus;
  attendanceRecordId: string | null;
  notification: NotificationInfo;
};

export type RosterResponse =
  | { isSchoolDay: false; reason: string; date: string }
  | { isSchoolDay: true; date: string; alreadySubmitted: boolean; students: RosterStudent[] };

export type RegisterResponse = {
  dates: string[];
  students: {
    id: string;
    fullName: string;
    rollNumber: string;
    className: string;
    records: Record<string, AttendanceStatus>;
  }[];
};

export type SchoolCalendarDay = {
  id: string;
  date: string;
  type: "HOLIDAY" | "WEEKEND";
  label: string | null;
};

export type CalendarResponse = {
  weeklyOffDays: number[];
  holidays: SchoolCalendarDay[];
};

export type SendNotificationResult = {
  jobId: string;
  deliveryId: string;
  status: string;
  sentAt: string;
  recipientPhone: string;
  messageText: string;
};
