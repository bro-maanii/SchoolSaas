"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/badge";
import { useBroadcastDetail, useBroadcastHistory } from "@/features/broadcasts/use-broadcasts";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Whole School",
  CLASS: "A Class",
  SECTION: "A Section",
  STUDENTS: "Selected Students",
  ABSENT_TODAY: "Absent Today",
  DEFAULTERS: "Fee Defaulters",
  STAFF: "Staff",
};

export default function BroadcastHistoryPage() {
  const { data, isPending, isError, refetch } = useBroadcastHistory({ pageSize: 50 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Message History</h1>
        <Link href="/communication/broadcast">
          <Button>New Broadcast</Button>
        </Link>
      </div>

      {isPending && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load message history." onRetry={() => refetch()} />}

      {!isPending && !isError && data && data.data.length === 0 && (
        <EmptyState
          title="No messages sent yet"
          action={
            <Link href="/communication/broadcast">
              <Button size="sm">Send your first broadcast</Button>
            </Link>
          }
        />
      )}

      {!isPending && !isError && data && data.data.length > 0 && (
        <div className="space-y-3">
          {data.data.map((row) => (
            <Card key={row.id} className="p-0">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {AUDIENCE_LABEL[row.audienceType] ?? row.audienceType}
                    <span className="ml-2 font-normal text-gray-500">
                      · {row.templateName ?? row.rawBody?.slice(0, 60) ?? ""}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Sent by {row.sentBy} ·{" "}
                    {new Date(row.sentAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{row.recipientCount} recipient(s)</span>
                  <span className="text-gray-400">{expandedId === row.id ? "▾" : "▸"}</span>
                </div>
              </button>

              {expandedId === row.id && <BroadcastDetailRows id={row.id} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BroadcastDetailRows({ id }: { id: string }) {
  const { data: detail, isPending } = useBroadcastDetail(id);

  if (isPending) {
    return (
      <div className="border-t border-surface-border p-4">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="border-t border-surface-border">
      {detail.rawBody && (
        <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="font-medium text-gray-400">Message: </span>
          {detail.rawBody}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Recipient</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {detail.deliveries.map((d) => (
              <tr key={d.id} className="border-b border-surface-border last:border-0">
                <td className="px-4 py-2 tabular-nums text-gray-700">{d.recipientPhone}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(d.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
