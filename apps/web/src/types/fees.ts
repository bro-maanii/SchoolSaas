export type FeeCategoryType = "MONTHLY" | "ANNUAL" | "ADMISSION" | "OTHER";
export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "BANK" | "OTHER";

export type FeeCategory = {
  id: string;
  name: string;
  type: FeeCategoryType;
  isRecurring: boolean;
};

export type AcademicYear = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export type FeeStructureItem = {
  id: string;
  classId: string;
  feeCategoryId: string;
  academicYearId: string;
  amount: number;
  class: { id: string; name: string };
  feeCategory: FeeCategory;
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  receivedByUser: { id: string; name: string };
};

export type Invoice = {
  id: string;
  studentId: string;
  student: {
    id: string;
    fullName: string;
    rollNumber: string;
    class: { id: string; name: string };
    section: { id: string; name: string };
  };
  feeCategory: FeeCategory;
  periodLabel: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  payments: Payment[];
};

export type DefaulterRow = {
  student: {
    id: string;
    fullName: string;
    rollNumber: string;
    class: { id: string; name: string };
    section: { id: string; name: string };
  };
  outstandingAmount: number;
  invoiceCount: number;
  daysOverdue: number;
  invoiceId: string;
};

export type FeeDashboardSummary = {
  period: string;
  collected: number;
  outstanding: number;
  defaulterCount: number;
  classWise: { classId: string; className: string; collected: number; outstanding: number }[];
};
