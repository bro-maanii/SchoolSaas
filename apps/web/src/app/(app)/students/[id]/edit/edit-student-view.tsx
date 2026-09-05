"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentForm, type StudentFormValues } from "@/features/students/student-form";
import { useStudent, useUpdateStudent } from "@/features/students/use-students";
import { ApiError } from "@/lib/api-client";
import { toastSuccess } from "@/store/toast-store";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import type { Student } from "@/types/students";

function toFormValues(student: Student): StudentFormValues {
  return {
    rollNumber: student.rollNumber,
    fullName: student.fullName,
    dob: student.dob ? student.dob.slice(0, 10) : "",
    gender: student.gender ?? "",
    classId: student.class.id,
    sectionId: student.section.id,
    guardians: student.guardians.map((link) => ({
      fullName: link.guardian.fullName,
      relationship: link.guardian.relationship,
      phoneE164: link.guardian.phoneE164,
      whatsappOptIn: link.guardian.whatsappOptIn,
      isPrimary: link.isPrimary,
    })),
  };
}

export function EditStudentView({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { data: student, isPending, isError, refetch } = useStudent(studentId);
  const updateStudent = useUpdateStudent();
  const [serverError, setServerError] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !student) {
    return <ErrorState message="Couldn't load this student." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Edit {student.fullName}</h1>
      <StudentForm
        initialValues={toFormValues(student)}
        submitLabel="Save changes"
        submitting={updateStudent.isPending}
        serverError={serverError}
        onCancel={() => router.push(`/students/${studentId}`)}
        onSubmit={async (input) => {
          setServerError(null);
          try {
            await updateStudent.mutateAsync({ id: studentId, input });
            toastSuccess("Student updated");
            router.push(`/students/${studentId}`);
          } catch (err) {
            setServerError(err instanceof ApiError ? err.message : "Failed to update student");
          }
        }}
      />
    </div>
  );
}
