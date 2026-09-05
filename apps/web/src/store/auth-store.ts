import { create } from "zustand";

export type TeacherAssignment = {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "PRINCIPAL" | "ACCOUNTANT" | "TEACHER";
  schoolId: string | null;
  teacherAssignments?: TeacherAssignment[];
};

type AuthState = {
  accessToken: string | null;
  user: SessionUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setSession: (accessToken: string, user: SessionUser) => void;
  setStatus: (status: AuthState["status"]) => void;
  clear: () => void;
};

// Access token lives in memory only — never localStorage — so it can't be
// read by an injected script. Page refresh re-derives it from the httpOnly
// refresh cookie via /auth/refresh (see AuthProvider).
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "idle",
  setSession: (accessToken, user) => set({ accessToken, user, status: "authenticated" }),
  setStatus: (status) => set({ status }),
  clear: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
}));
