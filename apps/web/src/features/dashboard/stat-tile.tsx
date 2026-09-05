import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type DeltaTone = "good" | "bad" | "neutral";

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  good: "text-success-600",
  bad: "text-danger-600",
  neutral: "text-gray-500",
};

/**
 * Signed delta vs a named period. `goodDirection` says which way is an
 * improvement (e.g. "up" for fee collected, "down" for fee outstanding) so
 * the tone always reads as good/bad rather than just positive/negative.
 */
export function deltaFromValues(
  current: number,
  previous: number,
  {
    goodDirection = "up",
    suffix = "",
    periodLabel = "vs last month",
  }: { goodDirection?: "up" | "down"; suffix?: string; periodLabel?: string } = {}
): { text: string; tone: DeltaTone } {
  const diff = current - previous;
  if (diff === 0) return { text: `No change ${periodLabel}`, tone: "neutral" };
  const isUp = diff > 0;
  const tone: DeltaTone = isUp === (goodDirection === "up") ? "good" : "bad";
  const sign = isUp ? "+" : "−";
  return { text: `${sign}${Math.abs(diff).toLocaleString()}${suffix} ${periodLabel}`, tone };
}

export function StatTile({
  label,
  value,
  valueClassName,
  delta,
  href,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  delta?: { text: string; tone: DeltaTone } | null;
  href?: string;
}) {
  const content = (
    <Card className={cn("p-5", href && "transition-shadow hover:shadow-md")}>
      <p className={cn("text-2xl font-bold text-gray-900", valueClassName)}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
      {delta && <p className={cn("mt-2 text-xs font-medium", DELTA_TONE_CLASS[delta.tone])}>{delta.text}</p>}
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
