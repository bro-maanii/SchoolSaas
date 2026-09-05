"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Search, LogOut } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  async function handleLogout() {
    await api.post("/auth/logout").catch(() => {});
    clear();
    // The next sign-in (same tab, no full reload) could be a different role
    // or a different school — without this, a stale cached response (e.g. an
    // Accountant's role-shaped /dashboard/summary) can get served to the next
    // account before its own request resolves.
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-surface-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={openCommandPalette}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-100 sm:max-w-xs"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search…</span>
          <kbd className="ml-auto hidden shrink-0 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:block">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role.replace("_", " ")}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
