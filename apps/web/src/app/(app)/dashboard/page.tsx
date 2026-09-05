"use client";

import { useAuthStore } from "@/store/auth-store";
import { TeacherDashboard } from "@/features/dashboard/teacher-dashboard";
import { AccountantDashboard } from "@/features/dashboard/accountant-dashboard";
import { FullDashboard } from "@/features/dashboard/full-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardPage() {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);

  if (status !== "authenticated") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (role === "TEACHER") return <TeacherDashboard />;
  if (role === "ACCOUNTANT") return <AccountantDashboard />;
  if (role === "SCHOOL_ADMIN" || role === "PRINCIPAL") return <FullDashboard />;

  return <EmptyState title="No dashboard is set up for this account role yet." />;
}
