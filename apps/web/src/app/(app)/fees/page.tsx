"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useFeeDashboard, useGenerateInvoices } from "@/features/fees/use-fees";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import { currentPeriod, formatMoney, formatPeriodLabel } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";

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

export default function FeeDashboardPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "SCHOOL_ADMIN" || role === "ACCOUNTANT";
  const [period, setPeriod] = useState(currentPeriod());
  const { data, isPending, isError, refetch } = useFeeDashboard(period);
  const generateInvoices = useGenerateInvoices();

  async function handleGenerate() {
    try {
      const result = await generateInvoices.mutateAsync(period);
      toastSuccess(
        result.created > 0
          ? `${result.created} invoice(s) generated for ${formatPeriodLabel(period)}`
          : `Invoices for ${formatPeriodLabel(period)} were already generated`
      );
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to generate invoices");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Fees</h1>
        <div className="flex flex-wrap items-center gap-3">
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
          {canManage && (
            <Button onClick={handleGenerate} disabled={generateInvoices.isPending}>
              {generateInvoices.isPending ? "Generating…" : "Generate this month's invoices"}
            </Button>
          )}
        </div>
      </div>

      {isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load the fee dashboard." onRetry={() => refetch()} />}

      {!isPending && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-2xl font-bold tabular-nums text-success-600">{formatMoney(data.collected)}</p>
              <p className="mt-1 text-xs text-gray-500">Collected this period</p>
            </Card>
            <Card className="p-5">
              <p className="text-2xl font-bold tabular-nums text-danger-600">{formatMoney(data.outstanding)}</p>
              <p className="mt-1 text-xs text-gray-500">Outstanding this period</p>
            </Card>
            <Card className="p-5">
              <p className="text-2xl font-bold tabular-nums text-gray-900">{data.defaulterCount}</p>
              <p className="mt-1 text-xs text-gray-500">
                Defaulters ·{" "}
                <Link href={`/fees/defaulters?period=${period}`} className="text-primary-600 hover:underline">
                  view list
                </Link>
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Class-wise collection</h2>
            {data.classWise.length === 0 ? (
              <p className="text-sm text-gray-500">
                No invoices generated for {formatPeriodLabel(period)} yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="py-2">Class</th>
                      <th className="py-2 text-right">Collected</th>
                      <th className="py-2 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.classWise.map((row) => (
                      <tr key={row.classId} className="border-b border-surface-border last:border-0">
                        <td className="py-2 text-gray-900">{row.className}</td>
                        <td className="py-2 text-right tabular-nums text-success-600">
                          {formatMoney(row.collected)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-danger-600">
                          {formatMoney(row.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
