"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useAddHoliday,
  useCalendar,
  useRemoveHoliday,
  useSetWeeklyOffDays,
} from "@/features/attendance/use-attendance";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SchoolCalendarPage() {
  const { data, isPending, isError, refetch } = useCalendar();
  const addHoliday = useAddHoliday();
  const removeHoliday = useRemoveHoliday();
  const setWeeklyOffDays = useSetWeeklyOffDays();

  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    try {
      await addHoliday.mutateAsync({ date, label: label.trim() || undefined });
      setDate("");
      setLabel("");
      toastSuccess("Holiday added");
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to add holiday");
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeHoliday.mutateAsync(id);
      toastSuccess("Holiday removed");
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to remove holiday");
    }
  }

  function toggleWeeklyOff(day: number) {
    if (!data) return;
    const next = data.weeklyOffDays.includes(day)
      ? data.weeklyOffDays.filter((d) => d !== day)
      : [...data.weeklyOffDays, day];
    setWeeklyOffDays.mutate(next, {
      onError: (err) => toastError(err instanceof ApiError ? err.message : "Failed to update weekly off days"),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">School Calendar</h1>

      {isPending && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState message="Couldn't load the calendar." onRetry={() => refetch()} />}

      {!isPending && !isError && data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weekly off days</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => {
                const active = data.weeklyOffDays.includes(w.value);
                return (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => toggleWeeklyOff(w.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Holidays</CardTitle>
            </CardHeader>

            <form onSubmit={handleAddHoliday} className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Label</label>
                <Input
                  placeholder="e.g. Eid Holiday"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-56"
                />
              </div>
              <Button type="submit" disabled={addHoliday.isPending || !date}>
                Add Holiday
              </Button>
            </form>

            {data.holidays.length === 0 ? (
              <EmptyState title="No holidays configured" />
            ) : (
              <div className="space-y-1">
                {data.holidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-900">
                      {new Date(h.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {h.label && <span className="ml-2 text-gray-500">· {h.label}</span>}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(h.id)} disabled={removeHoliday.isPending}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
