import type { SessionUser } from "@/store/auth-store";

export type NavItem = {
  label: string;
  href: string;
  roles: SessionUser["role"][];
  children?: { label: string; href: string }[];
};

// Mirrors Section 4 of the MVP plan. Role visibility per the permissions
// table in Section 2 — Teachers and Accountants see a reduced set.
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
  },
  {
    label: "Students",
    href: "/students",
    roles: ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT"],
    children: [
      { label: "All Students", href: "/students" },
      { label: "Add Student", href: "/students/new" },
      { label: "Bulk Import", href: "/students/import" },
      { label: "Classes & Sections", href: "/students/classes" },
    ],
  },
  {
    label: "Attendance",
    href: "/attendance",
    roles: ["SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"],
    children: [
      { label: "Mark Attendance", href: "/attendance/mark" },
      { label: "Attendance Register", href: "/attendance/register" },
      { label: "School Calendar", href: "/attendance/calendar" },
    ],
  },
  {
    label: "Fees",
    href: "/fees",
    roles: ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT"],
    children: [
      { label: "Fee Structure", href: "/fees/structure" },
      { label: "Record Payment", href: "/fees/payments" },
      { label: "Student Ledger", href: "/fees/ledger" },
      { label: "Defaulters", href: "/fees/defaulters" },
    ],
  },
  {
    label: "Communication",
    href: "/communication",
    roles: ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT"],
    children: [
      { label: "WhatsApp Templates", href: "/communication/templates" },
      { label: "Notification Log", href: "/communication/log" },
    ],
  },
  {
    label: "Training Center",
    href: "/training",
    roles: ["SCHOOL_ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"],
  },
  {
    label: "Settings",
    href: "/settings",
    roles: ["SCHOOL_ADMIN"],
    children: [
      { label: "Notification Rules", href: "/settings/notifications" },
      { label: "WhatsApp Connection", href: "/settings/whatsapp" },
    ],
  },
];

export function navForRole(role: SessionUser["role"]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
