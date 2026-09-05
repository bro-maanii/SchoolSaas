"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useClasses } from "@/features/classes/use-classes";
import type { GuardianFormInput, StudentFormInput } from "@/types/students";

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

function emptyGuardian(isPrimary: boolean): GuardianFormInput {
  return { fullName: "", relationship: "FATHER", phoneE164: "", whatsappOptIn: true, isPrimary };
}

export type StudentFormValues = {
  rollNumber: string;
  fullName: string;
  dob: string;
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  classId: string;
  sectionId: string;
  guardians: GuardianFormInput[];
};

export function defaultStudentFormValues(): StudentFormValues {
  return {
    rollNumber: "",
    fullName: "",
    dob: "",
    gender: "",
    classId: "",
    sectionId: "",
    guardians: [emptyGuardian(true)],
  };
}

type Errors = {
  form?: string;
  rollNumber?: string;
  fullName?: string;
  classId?: string;
  sectionId?: string;
  guardians?: string;
  guardianFields?: Record<number, Partial<Record<keyof GuardianFormInput, string>>>;
};

function validate(values: StudentFormValues): Errors {
  const errors: Errors = {};
  if (!values.rollNumber.trim()) errors.rollNumber = "Roll number is required";
  if (!values.fullName.trim()) errors.fullName = "Student name is required";
  if (!values.classId) errors.classId = "Select a class";
  if (!values.sectionId) errors.sectionId = "Select a section";

  const guardianFields: Errors["guardianFields"] = {};
  const phones = new Set<string>();
  let duplicatePhone = false;
  values.guardians.forEach((g, i) => {
    const fieldErrs: Partial<Record<keyof GuardianFormInput, string>> = {};
    if (!g.fullName.trim()) fieldErrs.fullName = "Required";
    if (!g.phoneE164.trim()) {
      fieldErrs.phoneE164 = "Required";
    } else if (!E164_REGEX.test(g.phoneE164.trim())) {
      fieldErrs.phoneE164 = "Use E.164 format, e.g. +923001234567";
    } else if (phones.has(g.phoneE164.trim())) {
      duplicatePhone = true;
    } else {
      phones.add(g.phoneE164.trim());
    }
    if (Object.keys(fieldErrs).length) guardianFields[i] = fieldErrs;
  });
  if (Object.keys(guardianFields).length) errors.guardianFields = guardianFields;

  const primaryCount = values.guardians.filter((g) => g.isPrimary).length;
  if (values.guardians.length === 0) {
    errors.guardians = "At least one guardian is required";
  } else if (primaryCount !== 1) {
    errors.guardians = "Exactly one guardian must be marked as primary";
  } else if (duplicatePhone) {
    errors.guardians = "Guardian phone numbers must be unique";
  }

  return errors;
}

function toApiInput(values: StudentFormValues): StudentFormInput {
  return {
    rollNumber: values.rollNumber.trim(),
    fullName: values.fullName.trim(),
    dob: values.dob || undefined,
    gender: values.gender || undefined,
    classId: values.classId,
    sectionId: values.sectionId,
    guardians: values.guardians.map((g) => ({
      ...g,
      fullName: g.fullName.trim(),
      phoneE164: g.phoneE164.trim(),
    })),
  };
}

export function StudentForm({
  initialValues,
  submitLabel,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: {
  initialValues?: StudentFormValues;
  submitLabel: string;
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (input: StudentFormInput) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<StudentFormValues>(initialValues ?? defaultStudentFormValues());
  const [errors, setErrors] = useState<Errors>({});
  const { data: classes } = useClasses();

  const selectedClass = useMemo(() => classes?.find((c) => c.id === values.classId), [classes, values.classId]);

  function update<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function updateGuardian(index: number, patch: Partial<GuardianFormInput>) {
    setValues((v) => ({
      ...v,
      guardians: v.guardians.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    }));
  }

  function setPrimary(index: number) {
    setValues((v) => ({
      ...v,
      guardians: v.guardians.map((g, i) => ({ ...g, isPrimary: i === index })),
    }));
  }

  function addGuardian() {
    setValues((v) => ({ ...v, guardians: [...v.guardians, emptyGuardian(false)] }));
  }

  function removeGuardian(index: number) {
    setValues((v) => ({ ...v, guardians: v.guardians.filter((_, i) => i !== index) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    const hasErrors =
      validation.rollNumber || validation.fullName || validation.classId || validation.sectionId ||
      validation.guardians || validation.guardianFields;
    if (hasErrors) return;
    onSubmit(toApiInput(values));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {serverError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {serverError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={values.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              error={errors.fullName}
            />
            <FieldError>{errors.fullName}</FieldError>
          </div>
          <div>
            <Label htmlFor="rollNumber">Roll number</Label>
            <Input
              id="rollNumber"
              value={values.rollNumber}
              onChange={(e) => update("rollNumber", e.target.value)}
              error={errors.rollNumber}
            />
            <FieldError>{errors.rollNumber}</FieldError>
          </div>
          <div>
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" value={values.dob} onChange={(e) => update("dob", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              value={values.gender}
              onChange={(e) => update("gender", e.target.value as StudentFormValues["gender"])}
            >
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class & section</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="classId">Class</Label>
            <Select
              id="classId"
              value={values.classId}
              onChange={(e) => setValues((v) => ({ ...v, classId: e.target.value, sectionId: "" }))}
              error={errors.classId}
            >
              <option value="">Select a class</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError>{errors.classId}</FieldError>
          </div>
          <div>
            <Label htmlFor="sectionId">Section</Label>
            <Select
              id="sectionId"
              value={values.sectionId}
              onChange={(e) => update("sectionId", e.target.value)}
              disabled={!selectedClass}
              error={errors.sectionId}
            >
              <option value="">{selectedClass ? "Select a section" : "Select a class first"}</option>
              {selectedClass?.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <FieldError>{errors.sectionId}</FieldError>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guardian(s)</CardTitle>
        </CardHeader>

        {errors.guardians && (
          <p className="mb-3 text-sm text-danger-600">{errors.guardians}</p>
        )}

        <div className="space-y-4">
          {values.guardians.map((guardian, index) => {
            const fieldErrs = errors.guardianFields?.[index] ?? {};
            return (
              <div key={index} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="primary-guardian"
                      checked={guardian.isPrimary}
                      onChange={() => setPrimary(index)}
                    />
                    Primary contact
                  </label>
                  {values.guardians.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGuardian(index)}
                      className="text-sm text-gray-400 hover:text-danger-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={guardian.fullName}
                      onChange={(e) => updateGuardian(index, { fullName: e.target.value })}
                      error={fieldErrs.fullName}
                    />
                    <FieldError>{fieldErrs.fullName}</FieldError>
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Select
                      value={guardian.relationship}
                      onChange={(e) =>
                        updateGuardian(index, { relationship: e.target.value as GuardianFormInput["relationship"] })
                      }
                    >
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone (WhatsApp)</Label>
                    <Input
                      placeholder="+923001234567"
                      value={guardian.phoneE164}
                      onChange={(e) => updateGuardian(index, { phoneE164: e.target.value })}
                      error={fieldErrs.phoneE164}
                    />
                    <FieldError>{fieldErrs.phoneE164}</FieldError>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={guardian.whatsappOptIn}
                        onChange={(e) => updateGuardian(index, { whatsappOptIn: e.target.checked })}
                      />
                      Send WhatsApp notifications to this number
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={addGuardian}>
          + Add another guardian
        </Button>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
