"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentForm, defaultStudentFormValues } from "@/features/students/student-form";
import { useCreateStudent } from "@/features/students/use-students";
import { ApiError } from "@/lib/api-client";
import { toastSuccess } from "@/store/toast-store";

export default function AddStudentPage() {
  const router = useRouter();
  const createStudent = useCreateStudent();
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Add Student</h1>
      <StudentForm
        initialValues={defaultStudentFormValues()}
        submitLabel="Add Student"
        submitting={createStudent.isPending}
        serverError={serverError}
        onCancel={() => router.push("/students")}
        onSubmit={async (input) => {
          setServerError(null);
          try {
            const student = await createStudent.mutateAsync(input);
            toastSuccess(`${student.fullName} added`);
            router.push(`/students/${student.id}`);
          } catch (err) {
            setServerError(err instanceof ApiError ? err.message : "Failed to create student");
          }
        }}
      />
    </div>
  );
}
