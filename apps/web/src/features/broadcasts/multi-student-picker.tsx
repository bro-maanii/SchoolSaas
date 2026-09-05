"use client";

import { useState } from "react";
import { useStudents } from "@/features/students/use-students";
import { Input } from "@/components/ui/input";

type PickedStudent = { id: string; fullName: string; rollNumber: string };

export function MultiStudentPicker({
  selected,
  onChange,
}: {
  selected: PickedStudent[];
  onChange: (students: PickedStudent[]) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data } = useStudents({ q: q || undefined, pageSize: 8 });

  const results = (q.trim().length > 0 ? data?.data ?? [] : []).filter(
    (s) => !selected.some((sel) => sel.id === s.id)
  );

  function add(student: PickedStudent) {
    onChange([...selected, student]);
    setQ("");
    setOpen(false);
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-md space-y-2">
      <div className="relative">
        <Input
          placeholder="Search a student to add…"
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
                  onMouseDown={() => add({ id: s.id, fullName: s.fullName, rollNumber: s.rollNumber })}
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

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700"
            >
              {s.fullName}
              <button type="button" onClick={() => remove(s.id)} className="text-primary-400 hover:text-primary-700">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
