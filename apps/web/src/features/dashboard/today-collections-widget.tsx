"use client";

import type { CSSProperties } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useTodayCollections } from "@/features/dashboard/use-dashboard";
import { formatMoney } from "@/lib/format";

const METHOD_LABEL: Record<string, string> = { CASH: "Cash", BANK: "Bank", OTHER: "Other" };

export function TodayCollectionsWidget({ classId }: { classId?: string }) {
  const { data, isPending, isError, refetch } = useTodayCollections({ classId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s fee collection</CardTitle>
      </CardHeader>

      {isPending && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && <ErrorState message="Couldn't load today's collections." onRetry={() => refetch()} />}

      {!isPending && !isError && data && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-success-50 px-4 py-3">
              <p className="text-xl font-bold text-success-600">{formatMoney(data.totalCollected)}</p>
              <p className="mt-0.5 text-xs text-gray-500">Collected today</p>
            </div>
            <div className="rounded-lg bg-primary-50 px-4 py-3">
              <p className="text-xl font-bold text-primary-700">{data.studentCount}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Student{data.studentCount === 1 ? "" : "s"} paid today
              </p>
            </div>
          </div>

          {data.payments.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No payments recorded yet today." />
            </div>
          ) : (
            <div className="mt-4 max-h-72 overflow-y-auto">
              <ul className="divide-y divide-surface-border">
                {data.payments.map((p, i) => (
                  <li
                    key={p.id}
                    className="stagger-item flex items-center justify-between gap-3 py-2.5 text-sm"
                    style={{ "--stagger-index": i } as CSSProperties}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{p.studentName}</p>
                      <p className="truncate text-xs text-gray-500">
                        {p.className} - {p.sectionName} · {p.feeCategory} · {METHOD_LABEL[p.method] ?? p.method}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular-nums font-medium text-success-600">{formatMoney(p.amount)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.paidAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
