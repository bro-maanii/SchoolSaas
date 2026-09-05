import Link from "next/link";
import type { DashboardAlert } from "@/types/dashboard";

export function AlertsStrip({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          href={alert.href}
          className="flex items-center justify-between gap-3 rounded-lg border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-600 transition-colors hover:bg-warning-50/70"
        >
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.28 11.18c.75 1.334-.213 2.987-1.744 2.987H3.72c-1.53 0-2.493-1.653-1.744-2.987l6.28-11.18ZM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-6.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{alert.message}</span>
          </span>
          <span className="shrink-0 text-xs underline">View</span>
        </Link>
      ))}
    </div>
  );
}
