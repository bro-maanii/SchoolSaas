"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  async function handleLogout() {
    await api.post("/auth/logout").catch(() => {});
    clear();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role.replace("_", " ")}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
