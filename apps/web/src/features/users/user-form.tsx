"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useClasses } from "@/features/classes/use-classes";
import type { AssignmentInput, StaffRole, StaffUser } from "@/types/users";

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  assignments: AssignmentInput[];
};

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "TEACHER", label: "Teacher" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "PRINCIPAL", label: "Principal" },
];

function toFormValues(user?: StaffUser): UserFormValues {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: (user?.role as StaffRole) ?? "TEACHER",
    assignments: user?.assignments.map((a) => ({ classId: a.classId, sectionId: a.sectionId })) ?? [],
  };
}

export function UserForm({
  mode,
  user,
  onSubmit,
  onCancel,
  pending,
}: {
  mode: "create" | "edit";
  user?: StaffUser;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}) {
  const { data: classes } = useClasses();
  // Initialized once from `user` — the parent gives this component a fresh
  // `key` whenever the create/edit target changes, so a new instance (and a
  // fresh lazy-initialized state) mounts instead of this needing to react to
  // prop changes itself.
  const [values, setValues] = useState<UserFormValues>(() => toFormValues(user));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (values.name.trim().length < 2) e.name = "Enter a full name";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) e.email = "Enter a valid email";
    if (mode === "create" && values.password.length < 8) e.password = "At least 8 characters";
    if (mode === "edit" && values.password && values.password.length < 8) e.password = "At least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    const completeAssignments = values.assignments.filter((a) => a.classId && a.sectionId);
    await onSubmit({ ...values, assignments: completeAssignments });
  }

  function updateAssignment(index: number, patch: Partial<AssignmentInput>) {
    setValues((v) => ({
      ...v,
      assignments: v.assignments.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));
  }

  function addAssignment() {
    setValues((v) => ({ ...v, assignments: [...v.assignments, { classId: "", sectionId: "" }] }));
  }

  function removeAssignment(index: number) {
    setValues((v) => ({ ...v, assignments: v.assignments.filter((_, i) => i !== index) }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="user-name">Full name</Label>
          <Input
            id="user-name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            error={errors.name}
          />
          <FieldError>{errors.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            error={errors.email}
          />
          <FieldError>{errors.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="user-password">{mode === "create" ? "Password" : "New password (optional)"}</Label>
          <Input
            id="user-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            error={errors.password}
            placeholder={mode === "create" ? "At least 8 characters" : "Leave blank to keep the current password"}
          />
          <FieldError>{errors.password}</FieldError>
          <p className="mt-1 text-xs text-gray-400">
            There&apos;s no email invite yet — share this password with them yourself.
          </p>
        </div>
        <div>
          <Label htmlFor="user-role">Role</Label>
          <Select
            id="user-role"
            value={values.role}
            onChange={(e) => setValues((v) => ({ ...v, role: e.target.value as StaffRole }))}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {values.role === "TEACHER" && (
        <div>
          <Label>Assigned classes</Label>
          <div className="space-y-2">
            {values.assignments.length === 0 && (
              <p className="text-xs text-gray-400">No classes assigned yet — you can assign these later too.</p>
            )}
            {values.assignments.map((a, i) => {
              const cls = classes?.find((c) => c.id === a.classId);
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Select
                    value={a.classId}
                    onChange={(e) => updateAssignment(i, { classId: e.target.value, sectionId: "" })}
                    className="w-40"
                  >
                    <option value="">Class…</option>
                    {classes
                      ?.filter((c) => !c.isArchived)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </Select>
                  <Select
                    value={a.sectionId}
                    onChange={(e) => updateAssignment(i, { sectionId: e.target.value })}
                    disabled={!a.classId}
                    className="w-32"
                  >
                    <option value="">Section…</option>
                    {cls?.sections
                      .filter((s) => !s.isArchived)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </Select>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAssignment(i)}>
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
          <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={addAssignment}>
            + Add a class
          </Button>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (mode === "create" ? "Creating…" : "Saving…") : mode === "create" ? "Create account" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
