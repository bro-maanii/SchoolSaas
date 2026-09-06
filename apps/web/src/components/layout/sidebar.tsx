"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  MessageSquare,
  GraduationCap,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { navForRole } from "@/lib/nav";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/students": Users,
  "/attendance": CalendarCheck,
  "/fees": Wallet,
  "/communication": MessageSquare,
  "/training": GraduationCap,
  "/settings": SettingsIcon,
};

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const items = role ? navForRole(role) : [];
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeSidebar);

  // Close the mobile drawer automatically whenever the route changes.
  useEffect(() => {
    closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 animate-fade-in lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-surface-border bg-surface transition-transform duration-200 ease-out",
          "lg:static lg:z-0 lg:w-60 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 px-5 text-sm font-semibold text-gray-900">
          <Image src="/logo-icon.png" alt="" width={28} height={28} className="shrink-0" priority />
          EduManage
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = NAV_ICONS[item.href];
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 animate-scale-in" />
                  )}
                  {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
                  {item.label}
                </Link>
                {active && item.children && (
                  <div className="ml-3 mt-1 space-y-0.5 border-l border-gray-200 pl-3 animate-fade-in-up">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-sm transition-colors",
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
    </>
  );
}
