"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function SettingsIndexPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    // Principal can only use Users & Roles (view-only) — Notification Rules
    // and WhatsApp Connection are School Admin only.
    router.replace(role === "PRINCIPAL" ? "/settings/users" : "/settings/notifications");
  }, [router, role]);

  return null;
}
