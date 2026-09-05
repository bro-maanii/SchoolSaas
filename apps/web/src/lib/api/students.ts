import { api, apiDownload, apiRequestWithMeta } from "@/lib/api-client";
import type {
  ImportCommitResult,
  ImportPreviewResult,
  ImportRowResult,
  Student,
  StudentFormInput,
  StudentStatus,
} from "@/types/students";

export type ListStudentsParams = {
  classId?: string;
  sectionId?: string;
  status?: StudentStatus;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type StudentsMeta = { total: number; page: number; pageSize: number };

export function listStudents(params: ListStudentsParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return apiRequestWithMeta<Student[], StudentsMeta>(`/students${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export function getStudent(id: string) {
  return api.get<Student>(`/students/${id}`);
}

export function createStudent(input: StudentFormInput) {
  return api.post<Student>("/students", input);
}

export function updateStudent(id: string, input: Partial<StudentFormInput> & { status?: StudentStatus }) {
  return api.patch<Student>(`/students/${id}`, input);
}

export function deactivateStudent(id: string) {
  return api.delete(`/students/${id}`);
}

export function importPreview(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return api.upload<ImportPreviewResult>("/students/import/preview", formData);
}

export function importCommit(rows: ImportRowResult["data"][]) {
  return api.post<ImportCommitResult>("/students/import/commit", { rows });
}

export async function downloadImportTemplate() {
  const blob = await apiDownload("/students/import/template");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student-import-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
