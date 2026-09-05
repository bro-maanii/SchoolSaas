"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useStudentAttendanceHistory } from "@/features/attendance/use-attendance";
import { NotifyAbsenceButton } from "@/features/attendance/notify-absence-button";

export function StudentAttendanceHistory({ studentId }: { studentId: string }) {
  const { data, isPending, isError, refetch } = useStudentAttendanceHistory(studentId);

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Couldn't load attendance history." onRetry={() => refetch()} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No attendance recorded for this student yet" />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-surface-border last:border-0">
              <td className="px-4 py-3 text-gray-900">
                {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {r.correctedAt && <span className="ml-2 text-xs text-gray-400">(corrected)</span>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-right">
                {r.status === "ABSENT" && (
                  <NotifyAbsenceButton attendanceRecordId={r.id} notification={r.notification} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
