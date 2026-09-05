import { api } from "@/lib/api-client";
import type { ClassRecord, SectionRecord } from "@/types/students";

export function listClasses(includeArchived = false) {
  return api.get<ClassRecord[]>(`/classes?includeArchived=${includeArchived}`);
}

export function createClass(input: { name: string; orderIndex?: number }) {
  return api.post<ClassRecord>("/classes", input);
}

export function updateClass(
  classId: string,
  input: { name?: string; orderIndex?: number; isArchived?: boolean }
) {
  return api.patch<ClassRecord>(`/classes/${classId}`, input);
}

export function createSection(classId: string, input: { name: string }) {
  return api.post<SectionRecord>(`/classes/${classId}/sections`, input);
}

export function updateSection(
  classId: string,
  sectionId: string,
  input: { name?: string; isArchived?: boolean }
) {
  return api.patch<SectionRecord>(`/classes/${classId}/sections/${sectionId}`, input);
}
