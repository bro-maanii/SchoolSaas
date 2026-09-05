"use client";

import { useState } from "react";
import { useStudents } from "@/features/students/use-students";
import { Input } from "@/components/ui/input";

export function StudentPicker({
  onSelect,
}: {
  onSelect: (student: { id: string; fullName: string; rollNumber: string; className: string }) => void;
}) {
  const [q, setQ] = useState("");
  const { data } = useStudents({ q: q || undefined, pageSize: 8 });
  const [open, setOpen] = useState(false);

  const results = q.trim().length > 0 ? data?.data ?? [] : [];

  return (
    <div className="relative max-w-md">
      <Input
        placeholder="Search a student by name or roll number…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-surface-border bg-white shadow-md">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                onMouseDown={() => {
                  onSelect({
                    id: s.id,
                    fullName: s.fullName,
                    rollNumber: s.rollNumber,
                    className: `${s.class.name} - ${s.section.name}`,
                  });
                  setQ("");
                  setOpen(false);
                }}
              >
                <span className="text-gray-900">{s.fullName}</span>
                <span className="text-gray-400">
                  {s.rollNumber} · {s.class.name} - {s.section.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
