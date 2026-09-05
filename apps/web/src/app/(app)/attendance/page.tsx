"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AttendanceIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/attendance/mark");
  }, [router]);
  return null;
}
