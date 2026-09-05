import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  neutral: "bg-gray-100 text-gray-600",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

// One shared status vocabulary across attendance, fees, and delivery — a
// "present" and a "paid" pill share the same green, reinforcing the mental
// model that green always means "good" (Section 15 of the plan).
const STATUS_TONE: Record<string, Tone> = {
  PRESENT: "success",
  PAID: "success",
  VALID: "success",
  ACTIVE: "success",
  DELIVERED: "success",
  SENT: "success",
  ABSENT: "danger",
  UNPAID: "danger",
  FAILED: "danger",
  LATE: "warning",
  PARTIAL: "warning",
  QUEUED: "warning",
  LEAVE: "neutral",
  READ: "success",
  CANCELLED: "neutral",
  PENDING: "warning",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status.toUpperCase()] ?? "neutral";
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return <Badge tone={tone}>{label}</Badge>;
}
