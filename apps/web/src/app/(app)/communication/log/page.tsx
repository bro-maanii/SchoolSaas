"use client";

import { useState } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useNotificationLog } from "@/features/notifications/use-notifications";
import { useAuthStore } from "@/store/auth-store";
import type { TriggerType } from "@/types/notifications";

const TRIGGER_LABEL: Record<TriggerType, string> = {
  ABSENCE: "Absence",
  FEE_REMINDER: "Fee Reminder",
  FEE_OVERDUE: "Fee Overdue",
};

export default function NotificationLogPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isAccountant = role === "ACCOUNTANT";

  const [triggerType, setTriggerType] = useState<TriggerType | "">("");
  const [status, setStatus] = useState("");

  const { data, isPending, isError, refetch } = useNotificationLog({
    triggerType: triggerType || undefined,
    status: status || undefined,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Notification Log</h1>
        <div className="flex flex-wrap gap-3">
          <Select value={triggerType} onChange={(e) => setTriggerType(e.target.value as TriggerType | "")} className="w-44">
            <option value="">All types</option>
            {!isAccountant && <option value="ABSENCE">Absence</option>}
            <option value="FEE_REMINDER">Fee Reminder</option>
            <option value="FEE_OVERDUE">Fee Overdue</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
            <option value="">All statuses</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="READ">Read</option>
            <option value="FAILED">Failed</option>
          </Select>
        </div>
      </div>

      {isPending && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load the notification log." onRetry={() => refetch()} />}

      {!isPending && !isError && data && data.data.length === 0 && (
        <EmptyState title="No notifications sent yet" />
      )}

      {!isPending && !isError && data && data.data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <tr key={row.id} className="border-b border-surface-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {row.student ? (
                      <Link href={`/students/${row.student.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                        {row.student.fullName}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{TRIGGER_LABEL[row.triggerType]}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{row.delivery?.recipientPhone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.delivery ? <StatusBadge status={row.delivery.status} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(row.scheduledFor).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
