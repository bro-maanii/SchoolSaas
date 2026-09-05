export type TeacherSummary = {
  role: "TEACHER";
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  presentTodayPercent: number | null;
  absentYesterday: number | null;
};

export type AccountantSummary = {
  role: "ACCOUNTANT";
  totalStudents: number;
  newAdmissionsThisMonth: number;
  feeCollectedThisMonth: number;
  feeCollectedLastMonth: number;
  feeOutstandingThisMonth: number;
  feeOutstandingLastMonth: number;
};

export type FullSummary = {
  role: "SCHOOL_ADMIN" | "PRINCIPAL";
  totalStudents: number;
  newAdmissionsThisMonth: number;
  presentToday: number;
  absentToday: number;
  presentTodayPercent: number | null;
  presentYesterdayPercent: number | null;
  absentYesterday: number | null;
  feeCollectedThisMonth: number;
  feeCollectedLastMonth: number;
  feeOutstandingThisMonth: number;
  feeOutstandingLastMonth: number;
};

export type DashboardSummary = TeacherSummary | AccountantSummary | FullSummary;

export type ClassAttendanceRow = {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  feePaid: number;
  feeUnpaid: number;
};

export type FeeTrendPoint = {
  period: string;
  collected: number;
  outstanding: number;
};

export type DashboardAlert = {
  id: string;
  message: string;
  href: string;
};

export type AdmissionRow = {
  id: string;
  fullName: string;
  className: string;
  sectionName: string;
  admissionDate: string;
};

export type AdmissionsResponse = {
  count: number;
  students: AdmissionRow[];
};

export type ClassStrengthRow = {
  classId: string;
  className: string;
  studentCount: number;
};
