export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    amount
  );
}

export function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatPeriodLabel(period: string) {
  if (!/^\d{4}-\d{2}$/.test(period)) return period;
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Compact "Jan '26" form for chart axis ticks, where the full label is too wide. */
export function formatPeriodShortLabel(period: string) {
  if (!/^\d{4}-\d{2}$/.test(period)) return period;
  const [year, month] = period.split("-").map(Number);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short" });
  return `${monthName} '${String(year).slice(-2)}`;
}
