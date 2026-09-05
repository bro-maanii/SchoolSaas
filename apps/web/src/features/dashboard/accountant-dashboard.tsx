"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useClasses } from "@/features/classes/use-classes";
import { useDashboardSummary, useFeeTrend } from "@/features/dashboard/use-dashboard";
import { useDefaulters } from "@/features/fees/use-fees";
import { StatTile, deltaFromValues } from "@/features/dashboard/stat-tile";
import { FeeTrendChart } from "@/features/dashboard/fee-trend-chart";
import { TodayCollectionsWidget } from "@/features/dashboard/today-collections-widget";
import { formatMoney, currentPeriod, formatPeriodLabel } from "@/lib/format";
import type { AccountantSummary } from "@/types/dashboard";

function monthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: formatPeriodLabel(value) });
  }
  return options;
}

// Accountant gets fee-scoped widgets only — attendance-by-class, alerts,
// admissions-list, and class-strength are 403'd for this role server-side,
// so the frontend never even attempts to call them here.
export function AccountantDashboard() {
  const [period, setPeriod] = useState(currentPeriod());
  const [classId, setClassId] = useState("");
  const { data: classes } = useClasses();

  const { data, isPending, isError, refetch } = useDashboardSummary({ month: period, classId: classId || undefined });
  const summary = data as AccountantSummary | undefined;
  const { data: feeTrend, isPending: trendPending, isError: trendError, refetch: refetchTrend } = useFeeTrend({
    months: 6,
    classId: classId || undefined,
  });
  const { data: defaulters, isPending: defaultersPending, isError: defaultersError } = useDefaulters({
    period,
    classId: classId || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
          >
            {monthOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">All classes</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Couldn't load the dashboard summary." onRetry={() => refetch()} />}

      {!isPending && !isError && summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total Students" value={summary.totalStudents.toLocaleString()} />
          <StatTile label="New Admissions" value={summary.newAdmissionsThisMonth.toLocaleString()} />
          <StatTile
            label="Fee Collected (Month)"
            value={formatMoney(summary.feeCollectedThisMonth)}
            valueClassName="text-success-600"
            delta={deltaFromValues(summary.feeCollectedThisMonth, summary.feeCollectedLastMonth, {
              goodDirection: "up",
            })}
          />
          <StatTile
            label="Fee Outstanding (Month)"
            value={formatMoney(summary.feeOutstandingThisMonth)}
            valueClassName="text-danger-600"
            href="/fees/defaulters"
            delta={deltaFromValues(summary.feeOutstandingThisMonth, summary.feeOutstandingLastMonth, {
              goodDirection: "down",
            })}
          />
        </div>
      )}

      <TodayCollectionsWidget classId={classId || undefined} />

      <Card>
        <CardHeader>
          <CardTitle>Fee collection trend (last 6 months)</CardTitle>
        </CardHeader>
        {trendPending && <Skeleton className="h-56 w-full" />}
        {trendError && <ErrorState message="Couldn't load the fee trend." onRetry={() => refetchTrend()} />}
        {!trendPending && !trendError && feeTrend && <FeeTrendChart data={feeTrend} />}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaulters — {formatPeriodLabel(period)}</CardTitle>
          <Link href={`/fees/defaulters?period=${period}`} className="text-xs text-primary-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        {defaultersPending && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {defaultersError && <ErrorState message="Couldn't load defaulters." />}
        {!defaultersPending && !defaultersError && defaulters && defaulters.length === 0 && (
          <EmptyState title={`No defaulters for ${formatPeriodLabel(period)} 🎉`} />
        )}
        {!defaultersPending && !defaultersError && defaulters && defaulters.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="py-2">Student</th>
                  <th className="py-2">Class</th>
                  <th className="py-2 text-right">Amount Due</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.slice(0, 5).map((row) => (
                  <tr key={row.student.id} className="border-b border-surface-border last:border-0">
                    <td className="py-2 text-gray-900">{row.student.fullName}</td>
                    <td className="py-2 text-gray-600">
                      {row.student.class.name} - {row.student.section.name}
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium text-danger-600">
                      {formatMoney(row.outstandingAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
