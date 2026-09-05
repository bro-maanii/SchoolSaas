"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useTemplates, useUpdateTemplate } from "@/features/notifications/use-notifications";
import { useAuthStore } from "@/store/auth-store";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import type { MessageTemplate } from "@/types/notifications";

const CATEGORY_LABEL: Record<string, string> = {
  ABSENCE: "Absence",
  FEE_REMINDER: "Fee Reminder",
  FEE_OVERDUE: "Fee Overdue",
  ANNOUNCEMENT: "Announcement",
  CUSTOM: "Custom",
};

export default function WhatsAppTemplatesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === "SCHOOL_ADMIN";
  const { data: templates, isPending, isError, refetch } = useTemplates();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">WhatsApp Templates</h1>

      <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
        These are used by the manual &quot;Send Notification&quot; buttons across Attendance and Fees. There&apos;s no
        live WhatsApp Business connection yet, so approval status is simulated — see WhatsApp Connection in Settings.
      </div>

      {isPending && <Skeleton className="h-40 w-full" />}
      {isError && <ErrorState message="Couldn't load templates." onRetry={() => refetch()} />}

      {!isPending && !isError && (!templates || templates.length === 0) && (
        <EmptyState title="No templates yet — one is created automatically the first time you send a notification" />
      )}

      {!isPending && !isError && templates && templates.length > 0 && (
        <div className="space-y-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, canEdit }: { template: MessageTemplate; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(template.bodyText);
  const updateTemplate = useUpdateTemplate();

  async function handleSave() {
    try {
      await updateTemplate.mutateAsync({ id: template.id, input: { bodyText: body } });
      setEditing(false);
      toastSuccess("Template updated");
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to update template");
    }
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{template.name}</h2>
          <Badge tone="neutral">{CATEGORY_LABEL[template.category] ?? template.category}</Badge>
          <Badge tone="success">{template.approvalStatus}</Badge>
        </div>
        {canEdit && !editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          />
          <p className="text-xs text-gray-400">
            Available variables depend on the trigger — e.g. {"{{parent_name}}"}, {"{{student_name}}"}, {"{{class}}"}, {"{{amount}}"}, {"{{due_date}}"}.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setBody(template.bodyText);
                setEditing(false);
              }}
              disabled={updateTemplate.isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-gray-600">{template.bodyText}</p>
      )}
    </Card>
  );
}
