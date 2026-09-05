import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const KPIS = [
  { label: "Total Students" },
  { label: "Present Today" },
  { label: "Absent Today" },
  { label: "Fee Collected (Month)" },
  { label: "Fee Outstanding (Month)" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
        No data yet — mark today&apos;s attendance to populate this dashboard.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-2xl font-bold tabular-nums text-gray-900">—</p>
            <p className="mt-1 text-xs text-gray-500">{kpi.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class-wise attendance</CardTitle>
        </CardHeader>
        <p className="text-sm text-gray-500">
          Set up classes and mark attendance to see this table populate.
        </p>
      </Card>
    </div>
  );
}
