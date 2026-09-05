"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeactivateStudent, useStudent, useUpdateStudent } from "@/features/students/use-students";
import { useAuthStore } from "@/store/auth-store";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

type Tab = "overview" | "attendance" | "fees";

export function StudentProfileView({ studentId }: { studentId: string }) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "SCHOOL_ADMIN";
  const { data: student, isPending, isError, refetch } = useStudent(studentId);
  const deactivate = useDeactivateStudent();
  const updateStudent = useUpdateStudent();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !student) {
    return <ErrorState message="Couldn't load this student." onRetry={() => refetch()} />;
  }

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync(studentId);
      toastSuccess(`${student!.fullName} deactivated`);
      setConfirmDeactivate(false);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to deactivate student");
      setConfirmDeactivate(false);
    }
  }

  async function handleReactivate() {
    try {
      await updateStudent.mutateAsync({ id: studentId, input: { status: "ACTIVE" } });
      toastSuccess(`${student!.fullName} reactivated`);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to reactivate student");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/students" className="text-sm text-gray-500 hover:text-gray-700">
            ← All Students
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{student.fullName}</h1>
            <StatusBadge status={student.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {student.class.name} - {student.section.name} · Roll No. {student.rollNumber}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push(`/students/${studentId}/edit`)}>
              Edit
            </Button>
            {student.status === "ACTIVE" ? (
              <Button variant="destructive" onClick={() => setConfirmDeactivate(true)}>
                Deactivate
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleReactivate} disabled={updateStudent.isPending}>
                {updateStudent.isPending ? "Reactivating…" : "Reactivate"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-surface-border">
        {(["overview", "attendance", "fees"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize",
              tab === t ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Student details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Full name" value={student.fullName} />
              <Row label="Roll number" value={student.rollNumber} />
              <Row label="Class" value={`${student.class.name} - ${student.section.name}`} />
              <Row label="Gender" value={student.gender ?? "—"} />
              <Row label="Date of birth" value={student.dob ? new Date(student.dob).toLocaleDateString() : "—"} />
              <Row label="Admission date" value={new Date(student.admissionDate).toLocaleDateString()} />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Guardians</h2>
            <div className="space-y-3">
              {student.guardians.map((link) => (
                <div key={link.guardian.id} className="rounded-md bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{link.guardian.fullName}</span>
                    {link.isPrimary && (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {link.guardian.relationship.charAt(0) + link.guardian.relationship.slice(1).toLowerCase()} ·{" "}
                    {link.guardian.phoneE164}
                  </p>
                  {!link.guardian.whatsappOptIn && (
                    <p className="mt-1 text-xs text-warning-600">WhatsApp notifications disabled</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "attendance" && (
        <Card>
          <p className="text-sm text-gray-500">
            Attendance history will appear here once the Attendance module ships (Phase 4).
          </p>
        </Card>
      )}

      {tab === "fees" && (
        <Card>
          <p className="text-sm text-gray-500">
            Fee ledger and payment history will appear here once the Fee module ships (Phase 3).
          </p>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDeactivate}
        title={`Deactivate ${student.fullName}?`}
        description="They'll be hidden from active rosters and attendance, but their history is preserved."
        confirmLabel="Deactivate"
        pending={deactivate.isPending}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
