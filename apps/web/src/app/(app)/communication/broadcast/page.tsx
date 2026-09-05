"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useClasses } from "@/features/classes/use-classes";
import { useTemplates } from "@/features/notifications/use-notifications";
import { useAudiencePreview, useCreateBroadcast } from "@/features/broadcasts/use-broadcasts";
import { MultiStudentPicker } from "@/features/broadcasts/multi-student-picker";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import { resolveTemplate } from "@/lib/resolve-template";
import { currentPeriod, formatPeriodLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AudienceType } from "@/types/broadcasts";

const AUDIENCE_OPTIONS: { value: AudienceType; label: string; description: string }[] = [
  { value: "ALL", label: "Whole School", description: "Every active student's primary guardian" },
  { value: "CLASS", label: "A Class", description: "All sections of one class" },
  { value: "SECTION", label: "A Section", description: "One specific class/section" },
  { value: "STUDENTS", label: "Selected Students", description: "Hand-pick specific students" },
  { value: "ABSENT_TODAY", label: "Absent Today", description: "Guardians of students marked absent today" },
  { value: "DEFAULTERS", label: "Fee Defaulters", description: "Guardians with an unpaid balance this period" },
  { value: "STAFF", label: "Staff", description: "Teachers and staff with a phone number on file" },
];

type PickedStudent = { id: string; fullName: string; rollNumber: string };

export default function BroadcastComposerPage() {
  const router = useRouter();
  const { data: classes } = useClasses();
  const { data: templates } = useTemplates();
  const createBroadcast = useCreateBroadcast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [audienceType, setAudienceType] = useState<AudienceType | "">("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [students, setStudents] = useState<PickedStudent[]>([]);
  const [period, setPeriod] = useState(currentPeriod());

  const [messageMode, setMessageMode] = useState<"custom" | "template">("custom");
  const [templateId, setTemplateId] = useState("");
  const [customBody, setCustomBody] = useState("");

  const selectedClass = classes?.find((c) => c.id === classId);
  const selectedTemplate = templates?.find((t) => t.id === templateId);
  const bodyText = messageMode === "template" ? selectedTemplate?.bodyText ?? "" : customBody;

  const filters = useMemo(
    () => ({
      classId: audienceType === "CLASS" ? classId : undefined,
      sectionId: audienceType === "SECTION" ? sectionId : undefined,
      studentIds: audienceType === "STUDENTS" ? students.map((s) => s.id) : undefined,
      period: audienceType === "DEFAULTERS" ? period : undefined,
    }),
    [audienceType, classId, sectionId, students, period]
  );

  const audienceReady =
    !!audienceType &&
    (audienceType !== "CLASS" || !!classId) &&
    (audienceType !== "SECTION" || !!sectionId) &&
    (audienceType !== "STUDENTS" || students.length > 0);

  const { data: preview, isPending: previewPending } = useAudiencePreview(
    (audienceType || "ALL") as AudienceType,
    filters,
    audienceReady
  );

  async function handleSend() {
    if (!audienceType || !bodyText.trim()) return;
    try {
      const result = await createBroadcast.mutateAsync({
        audienceType,
        classId: filters.classId,
        sectionId: filters.sectionId,
        studentIds: filters.studentIds,
        period: filters.period,
        templateId: messageMode === "template" ? templateId : undefined,
        rawBody: messageMode === "custom" ? customBody.trim() : undefined,
      });
      toastSuccess(
        `Sent to ${result.recipientCount} recipient(s) (simulated — no live WhatsApp connection yet)`
      );
      router.push("/communication/history");
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to send broadcast");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Broadcast Message</h1>

      <div className="flex items-center gap-2 text-sm">
        {(["Audience", "Message", "Preview & Send"] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                step === i + 1 ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"
              )}
            >
              {i + 1}
            </span>
            <span className={step === i + 1 ? "font-medium text-gray-900" : "text-gray-500"}>{label}</span>
            {i < 2 && <span className="mx-1 text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AUDIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAudienceType(opt.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  audienceType === opt.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{opt.description}</p>
              </button>
            ))}
          </div>

          {audienceType === "CLASS" && (
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-56">
              <option value="">Select a class</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}

          {audienceType === "SECTION" && (
            <div className="flex gap-3">
              <Select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} className="w-56">
                <option value="">Select a class</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!selectedClass} className="w-32">
                <option value="">Section</option>
                {selectedClass?.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {audienceType === "STUDENTS" && <MultiStudentPicker selected={students} onChange={setStudents} />}

          {audienceType === "DEFAULTERS" && (
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-48">
              {Array.from({ length: 6 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                return (
                  <option key={value} value={value}>
                    {formatPeriodLabel(value)}
                  </option>
                );
              })}
            </Select>
          )}

          {audienceReady && (
            <p className="text-sm text-gray-600">
              {previewPending ? (
                "Calculating recipients…"
              ) : preview && preview.count > 0 ? (
                <>
                  This will reach <strong className="text-gray-900">{preview.count}</strong> recipient(s).
                </>
              ) : (
                <span className="text-danger-600">This audience has no recipients right now.</span>
              )}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!audienceReady || previewPending || !preview || preview.count === 0}
            >
              Next: Compose Message
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMessageMode("custom")}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium",
                messageMode === "custom" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600"
              )}
            >
              Write custom message
            </button>
            <button
              type="button"
              onClick={() => setMessageMode("template")}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium",
                messageMode === "template" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600"
              )}
            >
              Use a saved template
            </button>
          </div>

          {messageMode === "template" ? (
            <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-64">
              <option value="">Select a template</option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          ) : (
            <div>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={5}
                placeholder="Write your message… use {{parent_name}}, {{student_name}}, {{class}}, {{section}} to personalize"
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {["parent_name", "student_name", "class", "section"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCustomBody((b) => `${b}{{${v}}}`)}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {bodyText && preview?.sample && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase text-gray-400">Preview (for {preview.sample.variables.student_name ?? preview.sample.variables.staff_name})</p>
              <p className="text-sm text-gray-700">{resolveTemplate(bodyText, preview.sample.variables)}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!bodyText.trim()}>
              Next: Preview &amp; Send
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4">
          <p className="text-sm text-gray-600">
            Sending to <strong className="text-gray-900">{preview?.count ?? 0}</strong> recipient(s) via{" "}
            <strong className="text-gray-900">{AUDIENCE_OPTIONS.find((o) => o.value === audienceType)?.label}</strong>.
          </p>

          {preview?.sample && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase text-gray-400">Resolved message (sample)</p>
              <p className="text-sm text-gray-700">{resolveTemplate(bodyText, preview.sample.variables)}</p>
            </div>
          )}

          <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-xs text-primary-700">
            No live WhatsApp connection is set up yet — this send is simulated, but a real record is written for
            every recipient in Message History.
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)} disabled={createBroadcast.isPending}>
              Back
            </Button>
            <Button onClick={handleSend} disabled={createBroadcast.isPending}>
              {createBroadcast.isPending ? "Sending…" : `Send to ${preview?.count ?? 0} recipient(s)`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
