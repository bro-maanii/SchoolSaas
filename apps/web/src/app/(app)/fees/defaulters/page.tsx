"use client";

import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useClasses } from "@/features/classes/use-classes";
import { useDefaulters } from "@/features/fees/use-fees";
import { NotifyFeeButton } from "@/features/fees/notify-fee-button";
import { formatMoney, currentPeriod, formatPeriodLabel } from "@/lib/format";

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

export default function DefaultersPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [classId, setClassId] = useState("");
  const { data: classes } = useClasses();
  const { data: defaulters, isPending, isError, refetch } = useDefaulters({ period, classId: classId || undefined });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Defaulters</h1>
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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load defaulters." onRetry={() => refetch()} />}

      {!isPending && !isError && defaulters && defaulters.length === 0 && (
        <EmptyState title={`No defaulters for ${formatPeriodLabel(period)} 🎉`} />
      )}

      {!isPending && !isError && defaulters && defaulters.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3 text-right">Amount Due</th>
                <th className="px-4 py-3 text-right">Days Overdue</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {defaulters.map((row) => (
                <tr key={row.student.id} className="border-b border-surface-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/students/${row.student.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {row.student.fullName}
                    </Link>
                    <span className="ml-2 text-gray-400">{row.student.rollNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.student.class.name} - {row.student.section.name}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-danger-600">
                    {formatMoney(row.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                    {row.daysOverdue > 0 ? row.daysOverdue : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <NotifyFeeButton invoiceId={row.invoiceId} />
                      <Link href="/fees/payments" className="inline-flex items-center px-3 text-sm text-primary-600 hover:underline">
                        Record Payment
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
