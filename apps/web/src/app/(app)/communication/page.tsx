"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CommunicationIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/communication/log");
  }, [router]);
  return null;
}
