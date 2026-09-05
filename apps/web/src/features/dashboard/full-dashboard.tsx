"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useClasses } from "@/features/classes/use-classes";
import {
  useDashboardSummary,
  useAttendanceByClass,
  useFeeTrend,
  useDashboardAlerts,
  useAdmissions,
  useClassStrength,
} from "@/features/dashboard/use-dashboard";
import { useDefaulters } from "@/features/fees/use-fees";
import { StatTile, deltaFromValues } from "@/features/dashboard/stat-tile";
import { AlertsStrip } from "@/features/dashboard/alerts-strip";
import { FeeTrendChart } from "@/features/dashboard/fee-trend-chart";
import { ClassStrengthChart } from "@/features/dashboard/class-strength-chart";
import { formatMoney, currentPeriod, formatPeriodLabel } from "@/lib/format";
import type { FullSummary } from "@/types/dashboard";

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

export function FullDashboard() {
  const [period, setPeriod] = useState(currentPeriod());
  const [classId, setClassId] = useState("");
  const filters = { month: period, classId: classId || undefined };

  const { data: classes } = useClasses();
  const { data: summaryData, isPending, isError, refetch } = useDashboardSummary(filters);
  const summary = summaryData as FullSummary | undefined;
  const { data: alerts } = useDashboardAlerts({ classId: classId || undefined });
  const {
    data: attendanceByClass,
    isPending: attendancePending,
    isError: attendanceError,
    refetch: refetchAttendance,
  } = useAttendanceByClass(filters);
  const { data: feeTrend, isPending: trendPending, isError: trendError, refetch: refetchTrend } = useFeeTrend({
    months: 6,
    classId: classId || undefined,
  });
  const {
    data: classStrength,
    isPending: strengthPending,
    isError: strengthError,
    refetch: refetchStrength,
  } = useClassStrength();
  const { data: defaulters, isPending: defaultersPending, isError: defaultersError } = useDefaulters({
    period,
    classId: classId || undefined,
  });
  const { data: admissions, isPending: admissionsPending, isError: admissionsError } = useAdmissions(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
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

      {alerts && alerts.length > 0 && <AlertsStrip alerts={alerts} />}

      {isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Couldn't load the dashboard summary." onRetry={() => refetch()} />}

      {!isPending && !isError && summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile label="Total Students" value={summary.totalStudents.toLocaleString()} />
          <StatTile
            label="Present Today"
            value={summary.presentTodayPercent !== null ? `${summary.presentTodayPercent}%` : "—"}
            valueClassName="text-success-600"
            delta={
              summary.presentYesterdayPercent !== null && summary.presentTodayPercent !== null
                ? deltaFromValues(summary.presentTodayPercent, summary.presentYesterdayPercent, {
                    goodDirection: "up",
                    suffix: "pt",
                    periodLabel: "vs yesterday",
                  })
                : null
            }
          />
          <StatTile
            label="Absent Today"
            value={summary.absentToday.toLocaleString()}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Fee collection trend (last 6 months)</CardTitle>
          </CardHeader>
          {trendPending && <Skeleton className="h-56 w-full" />}
          {trendError && <ErrorState message="Couldn't load the fee trend." onRetry={() => refetchTrend()} />}
          {!trendPending && !trendError && feeTrend && <FeeTrendChart data={feeTrend} />}
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Class-wise student strength</CardTitle>
          </CardHeader>
          {strengthPending && <Skeleton className="h-56 w-full" />}
          {strengthError && <ErrorState message="Couldn't load class strength." onRetry={() => refetchStrength()} />}
          {!strengthPending && !strengthError && classStrength && classStrength.length === 0 && (
            <EmptyState title="Set up classes to see student strength here." />
          )}
          {!strengthPending && !strengthError && classStrength && classStrength.length > 0 && (
            <ClassStrengthChart data={classStrength} />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class-wise attendance — {formatPeriodLabel(period)}</CardTitle>
        </CardHeader>
        {attendancePending && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {attendanceError && (
          <ErrorState message="Couldn't load class-wise attendance." onRetry={() => refetchAttendance()} />
        )}
        {!attendancePending && !attendanceError && attendanceByClass && attendanceByClass.length === 0 && (
          <EmptyState title="Set up classes and mark attendance to see this table populate." />
        )}
        {!attendancePending && !attendanceError && attendanceByClass && attendanceByClass.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="py-2">Class</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Present</th>
                  <th className="py-2 text-right">Absent</th>
                  <th className="py-2 text-right">Late</th>
                  <th className="py-2 text-right">Fees Paid</th>
                </tr>
              </thead>
              <tbody>
                {attendanceByClass.map((row) => (
                  <tr key={row.classId} className="border-b border-surface-border last:border-0">
                    <td className="py-2 text-gray-900">{row.className}</td>
                    <td className="py-2 text-right tabular-nums text-gray-600">{row.total}</td>
                    <td className="py-2 text-right tabular-nums text-success-600">{row.present}</td>
                    <td className="py-2 text-right tabular-nums text-danger-600">{row.absent}</td>
                    <td className="py-2 text-right tabular-nums text-warning-600">{row.late}</td>
                    <td className="py-2 text-right tabular-nums text-gray-600">
                      {row.feePaid}/{row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            <ul className="divide-y divide-surface-border">
              {defaulters.slice(0, 5).map((row) => (
                <li key={row.student.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{row.student.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {row.student.class.name} - {row.student.section.name}
                    </p>
                  </div>
                  <span className="tabular-nums font-medium text-danger-600">{formatMoney(row.outstandingAmount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New admissions — {formatPeriodLabel(period)}</CardTitle>
          </CardHeader>
          {admissionsPending && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {admissionsError && <ErrorState message="Couldn't load admissions." />}
          {!admissionsPending && !admissionsError && admissions && admissions.students.length === 0 && (
            <EmptyState title={`No new admissions in ${formatPeriodLabel(period)}.`} />
          )}
          {!admissionsPending && !admissionsError && admissions && admissions.students.length > 0 && (
            <ul className="divide-y divide-surface-border">
              {admissions.students.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{s.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {s.className} - {s.sectionName}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(s.admissionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
