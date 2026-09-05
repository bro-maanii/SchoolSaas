"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentPicker } from "@/features/fees/student-picker";
import { StudentLedgerView } from "@/features/fees/student-ledger-view";

export default function StudentLedgerPage() {
  const [student, setStudent] = useState<{ id: string; fullName: string; rollNumber: string; className: string } | null>(
    null
  );

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Student Ledger</h1>

      <Card>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Find a student</label>
        <StudentPicker onSelect={setStudent} />
      </Card>

      {!student && <EmptyState title="Search for a student above to view their fee ledger" />}

      {student && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{student.fullName}</h2>
              <p className="text-sm text-gray-500">
                Roll No. {student.rollNumber} · {student.className}
              </p>
            </div>
          </div>
          <StudentLedgerView studentId={student.id} />
        </div>
      )}
    </div>
  );
}
