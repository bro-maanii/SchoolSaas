"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatPeriodLabel, formatPeriodShortLabel } from "@/lib/format";
import type { FeeTrendPoint } from "@/types/dashboard";

// Validated pair (node scripts/validate_palette.js "#2563eb,#d97706" --mode light/dark — all
// checks pass). Red/green was tried first and failed CVD separation for a
// deutan reader, which is why "collected vs outstanding" isn't the success/
// danger pair used elsewhere in the app (badges, defaulters table).
const COLLECTED_COLOR = "var(--color-primary-600)";
const OUTSTANDING_COLOR = "var(--color-warning-600)";

const WIDTH = 640;
const HEIGHT = 260;
const PAD = { top: 16, right: 60, bottom: 32, left: 52 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function niceCeiling(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function compactMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)}K`;
  return `${Math.round(n)}`;
}

export function FeeTrendChart({ data }: { data: FeeTrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const maxValue = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => Math.max(d.collected, d.outstanding)));
    return niceCeiling(max * 1.15);
  }, [data]);

  const xFor = (i: number) => (data.length <= 1 ? PLOT_W / 2 : (i / (data.length - 1)) * PLOT_W);
  const yFor = (v: number) => PLOT_H - (v / maxValue) * PLOT_H;

  const collectedPoints = data.map((d, i) => [xFor(i), yFor(d.collected)] as const);
  const outstandingPoints = data.map((d, i) => [xFor(i), yFor(d.outstanding)] as const);
  const linePath = (points: readonly (readonly [number, number])[]) =>
    points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  function handlePointerMove(e: PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * PLOT_W;
    const step = data.length <= 1 ? PLOT_W : PLOT_W / (data.length - 1);
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(relX / step)));
    setHoverIndex(idx);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: COLLECTED_COLOR }} />
            Collected
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: OUTSTANDING_COLOR }} />
            Outstanding
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowTable((s) => !s)}>
          {showTable ? "View chart" : "View as table"}
        </Button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="py-2">Month</th>
                <th className="py-2 text-right">Collected</th>
                <th className="py-2 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.period} className="border-b border-surface-border last:border-0">
                  <td className="py-2 text-gray-900">{formatPeriodLabel(d.period)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-700">{formatMoney(d.collected)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-700">{formatMoney(d.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Fee collection trend">
            <g transform={`translate(${PAD.left},${PAD.top})`}>
              {yTicks.map((tick) => {
                const y = yFor(tick);
                return (
                  <g key={tick}>
                    <line x1={0} x2={PLOT_W} y1={y} y2={y} stroke="var(--color-gray-200)" strokeWidth={1} />
                    <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
                      {compactMoney(tick)}
                    </text>
                  </g>
                );
              })}

              {data.map((d, i) => (
                <text
                  key={d.period}
                  x={xFor(i)}
                  y={PLOT_H + 18}
                  textAnchor="middle"
                  className="fill-gray-500 text-[10px]"
                >
                  {formatPeriodShortLabel(d.period)}
                </text>
              ))}

              <path d={linePath(collectedPoints)} fill="none" stroke={COLLECTED_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <path d={linePath(outstandingPoints)} fill="none" stroke={OUTSTANDING_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

              {collectedPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={4} fill={COLLECTED_COLOR} stroke="var(--color-surface)" strokeWidth={2} />
              ))}
              {outstandingPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={4} fill={OUTSTANDING_COLOR} stroke="var(--color-surface)" strokeWidth={2} />
              ))}

              {data.length > 0 && (
                <>
                  <text
                    x={collectedPoints[collectedPoints.length - 1][0] + 8}
                    y={collectedPoints[collectedPoints.length - 1][1]}
                    dominantBaseline="middle"
                    className="fill-gray-700 text-[10px] font-medium"
                  >
                    {compactMoney(data[data.length - 1].collected)}
                  </text>
                  <text
                    x={outstandingPoints[outstandingPoints.length - 1][0] + 8}
                    y={outstandingPoints[outstandingPoints.length - 1][1]}
                    dominantBaseline="middle"
                    className="fill-gray-700 text-[10px] font-medium"
                  >
                    {compactMoney(data[data.length - 1].outstanding)}
                  </text>
                </>
              )}

              {hoverIndex !== null && (
                <line
                  x1={xFor(hoverIndex)}
                  x2={xFor(hoverIndex)}
                  y1={0}
                  y2={PLOT_H}
                  stroke="var(--color-gray-300)"
                  strokeWidth={1}
                />
              )}

              <rect
                x={0}
                y={0}
                width={PLOT_W}
                height={PLOT_H}
                fill="transparent"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoverIndex(null)}
                style={{ cursor: "crosshair" }}
              />
            </g>
          </svg>

          {hovered && hoverIndex !== null && (
            <div
              className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-md border border-surface-border bg-surface px-3 py-2 text-xs shadow-md"
              style={{
                left: `${((PAD.left + xFor(hoverIndex)) / WIDTH) * 100}%`,
              }}
            >
              <p className="mb-1 font-medium text-gray-900">{formatPeriodLabel(hovered.period)}</p>
              <p className="flex items-center gap-1.5 text-gray-600">
                <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: COLLECTED_COLOR }} />
                <span className="font-semibold text-gray-900">{formatMoney(hovered.collected)}</span> collected
              </p>
              <p className="flex items-center gap-1.5 text-gray-600">
                <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: OUTSTANDING_COLOR }} />
                <span className="font-semibold text-gray-900">{formatMoney(hovered.outstanding)}</span> outstanding
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
