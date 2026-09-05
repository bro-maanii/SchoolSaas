"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClassStrengthRow } from "@/types/dashboard";

// Single series comparing magnitude across classes with no inherent order
// beyond grade progression — one flat hue for every bar (never a value ramp
// on nominal-ish categories; see anti-patterns.md "value-ramp on nominal
// categories"). No legend needed for one series — the card title says what's plotted.
const BAR_COLOR = "var(--color-primary-600)";

const ROW_H = 28;
const BAR_H = 16;
const PAD = { top: 4, right: 44, bottom: 4, left: 96 };
const WIDTH = 560;

export function ClassStrengthChart({ data }: { data: ClassStrengthRow[] }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const maxCount = Math.max(1, ...data.map((d) => d.studentCount));
  const plotW = WIDTH - PAD.left - PAD.right;
  const height = data.length * ROW_H + PAD.top + PAD.bottom;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowTable((s) => !s)}>
          {showTable ? "View chart" : "View as table"}
        </Button>
      </div>

      {showTable ? (
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="py-2">Class</th>
              <th className="py-2 text-right">Students</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.classId} className="border-b border-surface-border last:border-0">
                <td className="py-2 text-gray-900">{row.className}</td>
                <td className="py-2 text-right tabular-nums text-gray-700">{row.studentCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="img" aria-label="Class-wise student strength">
          {data.map((row, i) => {
            const y = PAD.top + i * ROW_H;
            const barW = (row.studentCount / maxCount) * plotW;
            const isHovered = hoverId === row.classId;
            return (
              <g key={row.classId}>
                <text
                  x={PAD.left - 10}
                  y={y + BAR_H / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-gray-600 text-[11px]"
                >
                  {row.className}
                </text>
                <rect x={PAD.left} y={y} width={plotW} height={BAR_H} rx={4} fill="var(--color-gray-100)" />
                <rect
                  x={PAD.left}
                  y={y}
                  width={Math.max(barW, 2)}
                  height={BAR_H}
                  rx={4}
                  fill={BAR_COLOR}
                  opacity={isHovered ? 0.85 : 1}
                />
                <text
                  x={PAD.left + barW + 8}
                  y={y + BAR_H / 2}
                  dominantBaseline="middle"
                  className="fill-gray-700 text-[11px] font-medium"
                >
                  {row.studentCount}
                </text>
                <rect
                  x={0}
                  y={y - 2}
                  width={WIDTH}
                  height={ROW_H}
                  fill="transparent"
                  onPointerEnter={() => setHoverId(row.classId)}
                  onPointerLeave={() => setHoverId(null)}
                >
                  <title>{`${row.className}: ${row.studentCount} student(s)`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
