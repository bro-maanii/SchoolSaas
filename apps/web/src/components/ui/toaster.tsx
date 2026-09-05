"use client";

import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/cn";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-md",
            toast.tone === "error"
              ? "border-danger-200 bg-white text-danger-700"
              : "border-success-200 bg-white text-success-700"
          )}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
