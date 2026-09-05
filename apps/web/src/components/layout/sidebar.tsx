"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { navForRole } from "@/lib/nav";
import { useAuthStore } from "@/store/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const items = role ? navForRole(role) : [];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-border bg-surface">
      <div className="flex h-14 items-center px-5 text-sm font-semibold text-gray-900">
        School SaaS
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {item.label}
              </Link>
              {active && item.children && (
                <div className="ml-3 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-sm",
                        pathname === child.href
                          ? "text-primary-700 font-medium"
                          : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
