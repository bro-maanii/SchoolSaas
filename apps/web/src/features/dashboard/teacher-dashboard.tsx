"use client";

import { useAuthStore } from "@/store/auth-store";
import { useDashboardSummary } from "@/features/dashboard/use-dashboard";
import { StatTile, deltaFromValues } from "@/features/dashboard/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import type { TeacherSummary } from "@/types/dashboard";

// Teacher gets a small "their class" widget only — no filters, no fee data,
// no other classes' data — the API itself never returns fee fields or other
// sections' students to this role, so there's nothing here to accidentally leak.
export function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isPending, isError, refetch } = useDashboardSummary({});
  const summary = data as TeacherSummary | undefined;

  const classLabel = user?.teacherAssignments?.length
    ? user.teacherAssignments.map((a) => `${a.className} - ${a.sectionName}`).join(", ")
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">My Class Today</h1>
        {classLabel && <p className="text-sm text-gray-500">{classLabel}</p>}
      </div>

      {isPending && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load your class summary." onRetry={() => refetch()} />}

      {!isPending && !isError && summary && (
        <div className="grid grid-cols-2 gap-4">
          <StatTile label="Total Students" value={String(summary.totalStudents)} />
          <StatTile label="Present Today" value={String(summary.presentToday)} valueClassName="text-success-600" />
          <StatTile
            label="Absent Today"
            value={String(summary.absentToday)}
            valueClassName="text-danger-600"
            delta={
              summary.absentYesterday !== null
                ? deltaFromValues(summary.absentToday, summary.absentYesterday, {
                    goodDirection: "down",
                    periodLabel: "vs yesterday",
                  })
                : null
            }
          />
          <StatTile label="Present %" value={summary.presentTodayPercent !== null ? `${summary.presentTodayPercent}%` : "—"} />
        </div>
      )}
    </div>
  );
}
