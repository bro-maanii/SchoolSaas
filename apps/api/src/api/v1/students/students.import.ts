import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { E164_REGEX } from "@/lib/phone";

export const CSV_TEMPLATE_COLUMNS = [
  "rollNumber",
  "fullName",
  "dob",
  "gender",
  "className",
  "sectionName",
  "guardianFullName",
  "guardianRelationship",
  "guardianPhone",
  "guardianWhatsappOptIn",
] as const;

export type RawImportRow = Record<string, string>;

export type ValidatedImportRow = {
  rowNumber: number;
  data: RawImportRow;
  errors: string[];
  resolved?: {
    classId: string;
    sectionId: string;
    className: string;
    sectionName: string;
    rollNumber: string;
    fullName: string;
    dob?: Date;
    gender?: "MALE" | "FEMALE" | "OTHER";
    guardian: {
      fullName: string;
      relationship: "FATHER" | "MOTHER" | "OTHER";
      phoneE164: string;
      whatsappOptIn: boolean;
    };
  };
};

export function parseCsv(buffer: Buffer): RawImportRow[] {
  return parse(buffer, {
    columns: (header: string[]) => header.map((h) => h.trim()),
    skip_empty_lines: true,
    trim: true,
  });
}

const GENDER_MAP: Record<string, "MALE" | "FEMALE" | "OTHER"> = {
  m: "MALE",
  male: "MALE",
  f: "FEMALE",
  female: "FEMALE",
  o: "OTHER",
  other: "OTHER",
};

const RELATIONSHIP_MAP: Record<string, "FATHER" | "MOTHER" | "OTHER"> = {
  father: "FATHER",
  mother: "MOTHER",
  other: "OTHER",
  guardian: "OTHER",
};

/**
 * Validates every row of a bulk-import CSV against the school's live class/
 * section list and existing roll numbers, and against duplicates within the
 * file itself. Used by both the preview endpoint (dry run) and the commit
 * endpoint (which re-validates from scratch rather than trusting the client's
 * "this row was valid" claim from an earlier preview call).
 */
export async function validateImportRows(schoolId: string, rows: RawImportRow[]): Promise<ValidatedImportRow[]> {
  const classes = await prisma.class.findMany({
    where: { schoolId, isArchived: false },
    include: { sections: { where: { isArchived: false } } },
  });

  const classByName = new Map(classes.map((c) => [c.name.trim().toLowerCase(), c]));

  const existingStudents = await prisma.student.findMany({
    where: { schoolId },
    select: { classId: true, rollNumber: true },
  });
  const existingRollNumbers = new Set(existingStudents.map((s) => `${s.classId}::${s.rollNumber.toLowerCase()}`));

  const seenInFile = new Set<string>();
  const results: ValidatedImportRow[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const errors: string[] = [];

    const rollNumber = row.rollNumber?.trim();
    const fullName = row.fullName?.trim();
    const className = row.className?.trim();
    const sectionName = row.sectionName?.trim();
    const guardianFullName = row.guardianFullName?.trim();
    const guardianPhone = row.guardianPhone?.trim();
    const guardianRelationshipRaw = row.guardianRelationship?.trim().toLowerCase();
    const genderRaw = row.gender?.trim().toLowerCase();
    const dobRaw = row.dob?.trim();
    const whatsappOptInRaw = row.guardianWhatsappOptIn?.trim().toLowerCase();

    if (!rollNumber) errors.push("Roll number is required");
    if (!fullName) errors.push("Student name is required");
    if (!className) errors.push("Class is required");
    if (!sectionName) errors.push("Section is required");
    if (!guardianFullName) errors.push("Guardian name is required");
    if (!guardianPhone) {
      errors.push("Guardian phone is required");
    } else if (!E164_REGEX.test(guardianPhone)) {
      errors.push("Guardian phone must be in E.164 format, e.g. +923001234567");
    }

    let relationship: "FATHER" | "MOTHER" | "OTHER" | undefined;
    if (guardianRelationshipRaw) {
      relationship = RELATIONSHIP_MAP[guardianRelationshipRaw];
      if (!relationship) errors.push('Guardian relationship must be "Father", "Mother", or "Other"');
    } else {
      errors.push("Guardian relationship is required");
    }

    let gender: "MALE" | "FEMALE" | "OTHER" | undefined;
    if (genderRaw) {
      gender = GENDER_MAP[genderRaw];
      if (!gender) errors.push('Gender must be "Male", "Female", or "Other" (or left blank)');
    }

    let dob: Date | undefined;
    if (dobRaw) {
      const parsed = new Date(dobRaw);
      if (Number.isNaN(parsed.getTime())) {
        errors.push("Date of birth must be a valid date (YYYY-MM-DD)");
      } else {
        dob = parsed;
      }
    }

    const cls = className ? classByName.get(className.toLowerCase()) : undefined;
    if (className && !cls) {
      errors.push(`Class "${className}" was not found — create it first in Classes & Sections`);
    }
    const section = cls && sectionName
      ? cls.sections.find((s) => s.name.trim().toLowerCase() === sectionName.toLowerCase())
      : undefined;
    if (cls && sectionName && !section) {
      errors.push(`Section "${sectionName}" was not found in class "${className}"`);
    }

    if (cls && section && rollNumber) {
      const dbKey = `${cls.id}::${rollNumber.toLowerCase()}`;
      const fileKey = `${cls.id}::${rollNumber.toLowerCase()}`;
      if (existingRollNumbers.has(dbKey)) {
        errors.push(`Roll number "${rollNumber}" already exists in class "${className}"`);
      } else if (seenInFile.has(fileKey)) {
        errors.push(`Roll number "${rollNumber}" is duplicated elsewhere in this file`);
      } else {
        seenInFile.add(fileKey);
      }
    }

    const whatsappOptIn = whatsappOptInRaw ? whatsappOptInRaw !== "false" && whatsappOptInRaw !== "0" : true;

    results.push({
      rowNumber,
      data: row,
      errors,
      resolved:
        errors.length === 0 && cls && section && relationship
          ? {
              classId: cls.id,
              sectionId: section.id,
              className: cls.name,
              sectionName: section.name,
              rollNumber: rollNumber!,
              fullName: fullName!,
              dob,
              gender,
              guardian: {
                fullName: guardianFullName!,
                relationship,
                phoneE164: guardianPhone!,
                whatsappOptIn,
              },
            }
          : undefined,
    });
  });

  return results;
}
