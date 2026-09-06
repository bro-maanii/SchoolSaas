export type StaffRole = "PRINCIPAL" | "ACCOUNTANT" | "TEACHER";
export type UserRole = "SCHOOL_ADMIN" | StaffRole;

export type ClassAssignment = {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
};

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  assignments: ClassAssignment[];
};

export type UsersResponse = {
  users: StaffUser[];
  staffCount: number;
  staffLimit: number;
};

export type AssignmentInput = { classId: string; sectionId: string };

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  assignments?: AssignmentInput[];
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: StaffRole;
  assignments?: AssignmentInput[];
};
