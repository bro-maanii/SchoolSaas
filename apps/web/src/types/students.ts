export type ClassRecord = {
  id: string;
  name: string;
  orderIndex: number;
  isArchived: boolean;
  sections: SectionRecord[];
  _count?: { students: number };
};

export type SectionRecord = {
  id: string;
  classId: string;
  name: string;
  isArchived: boolean;
};

export type GuardianRelationship = "FATHER" | "MOTHER" | "OTHER";

export type Guardian = {
  id: string;
  fullName: string;
  relationship: GuardianRelationship;
  phoneE164: string;
  whatsappOptIn: boolean;
};

export type StudentGuardianLink = {
  guardian: Guardian;
  isPrimary: boolean;
};

export type Gender = "MALE" | "FEMALE" | "OTHER";
export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED";

export type Student = {
  id: string;
  rollNumber: string;
  fullName: string;
  dob: string | null;
  gender: Gender | null;
  admissionDate: string;
  status: StudentStatus;
  createdAt: string;
  class: { id: string; name: string };
  section: { id: string; name: string };
  guardians: StudentGuardianLink[];
};

export type GuardianFormInput = {
  fullName: string;
  relationship: GuardianRelationship;
  phoneE164: string;
  whatsappOptIn: boolean;
  isPrimary: boolean;
};

export type StudentFormInput = {
  rollNumber: string;
  fullName: string;
  dob?: string;
  gender?: Gender;
  classId: string;
  sectionId: string;
  guardians: GuardianFormInput[];
};

export type ImportRowResult = {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
  resolved?: {
    classId: string;
    sectionId: string;
    className: string;
    sectionName: string;
    rollNumber: string;
    fullName: string;
  };
};

export type ImportPreviewResult = {
  rows: ImportRowResult[];
  summary: { total: number; valid: number; invalid: number };
};

export type ImportCommitResult = {
  created: number;
  failed: ImportRowResult[];
  totalRows: number;
};
