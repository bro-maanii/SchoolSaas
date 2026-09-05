"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useClasses } from "@/features/classes/use-classes";
import { useDeactivateStudent, useStudents, useUpdateStudent } from "@/features/students/use-students";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

const PAGE_SIZE = 25;

export default function StudentsListPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "SCHOOL_ADMIN";

  const [q, setQ] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<"" | "ACTIVE" | "INACTIVE" | "GRADUATED">("ACTIVE");
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: classes } = useClasses();
  const { data, isPending, isError, refetch, isPlaceholderData } = useStudents({
    q: q || undefined,
    classId: classId || undefined,
    status: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const deactivate = useDeactivateStudent();
  const updateStudent = useUpdateStudent();

  async function handleReactivate(id: string, name: string) {
    try {
      await updateStudent.mutateAsync({ id, input: { status: "ACTIVE" } });
      toastSuccess(`${name} reactivated`);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to reactivate student");
    }
  }

  const students = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return;
    try {
      await deactivate.mutateAsync(deactivateTarget.id);
      toastSuccess(`${deactivateTarget.name} deactivated`);
      setDeactivateTarget(null);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to deactivate student");
      setDeactivateTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Students</h1>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link href="/students/import">
              <Button variant="secondary">Bulk Import</Button>
            </Link>
            <Link href="/students/new">
              <Button>Add Student</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="Search by name or roll number…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="w-48"
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All classes</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="GRADUATED">Graduated</option>
        </Select>
      </div>

      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load students." onRetry={() => refetch()} />}

      {!isPending && !isError && students.length === 0 && (
        <EmptyState
          title={
            q || classId
              ? "No students match your filters"
              : "No students yet — add your first student or import a CSV"
          }
          action={
            canManage && !q && !classId ? (
              <div className="flex gap-2">
                <Link href="/students/new">
                  <Button size="sm">Add Student</Button>
                </Link>
                <Link href="/students/import">
                  <Button variant="secondary" size="sm">
                    Bulk Import
                  </Button>
                </Link>
              </div>
            ) : undefined
          }
        />
      )}

      {!isPending && !isError && students.length > 0 && (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Roll No.</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Guardian Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const primary = student.guardians.find((g) => g.isPrimary) ?? student.guardians[0];
                  return (
                    <tr key={student.id} className="border-b border-surface-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/students/${student.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                          {student.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">{student.rollNumber}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.class.name} - {student.section.name}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">{primary?.guardian.phoneE164 ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/students/${student.id}`)}>
                            View
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/students/${student.id}/edit`)}
                              >
                                Edit
                              </Button>
                              {student.status === "ACTIVE" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeactivateTarget({ id: student.id, name: student.fullName })}
                                >
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={updateStudent.isPending}
                                  onClick={() => handleReactivate(student.id, student.fullName)}
                                >
                                  Reactivate
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>
              {total} student{total === 1 ? "" : "s"}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deactivateTarget !== null}
        title={`Deactivate ${deactivateTarget?.name}?`}
        description="The student will be hidden from active rosters and attendance, but their history is preserved. You can reactivate them later from Edit."
        confirmLabel="Deactivate"
        pending={deactivate.isPending}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
