"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useNotificationRules, useUpdateRule } from "@/features/notifications/use-notifications";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { NotificationRule, TriggerType } from "@/types/notifications";

const TRIGGER_LABEL: Record<TriggerType, string> = {
  ABSENCE: "Absence notifications",
  FEE_REMINDER: "Fee reminders",
  FEE_OVERDUE: "Fee overdue notices",
};

const TRIGGER_DESCRIPTION: Record<TriggerType, string> = {
  ABSENCE: "The \"Send Notification\" button on Mark Attendance and student profiles.",
  FEE_REMINDER: "The \"Send Reminder\" button for unpaid invoices not yet past due.",
  FEE_OVERDUE: "The \"Send Reminder\" button for invoices past their due date.",
};

export default function NotificationRulesPage() {
  const { data: rules, isPending, isError, refetch } = useNotificationRules();
  const updateRule = useUpdateRule();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Notification Rules</h1>

      <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
        Sending is always manually triggered by staff — nothing goes out automatically. These settings control
        whether the send buttons are allowed to work, and during which hours, so a message never goes out at 11pm
        even when someone clicks send.
      </div>

      {isPending && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState message="Couldn't load notification rules." onRetry={() => refetch()} />}

      {!isPending && !isError && rules && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onUpdate={(input) =>
                updateRule.mutate(
                  { triggerType: rule.triggerType, input },
                  {
                    onSuccess: () => toastSuccess("Notification rule updated"),
                    onError: (err) => toastError(err instanceof ApiError ? err.message : "Failed to update rule"),
                  }
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RuleCard({
  rule,
  onUpdate,
}: {
  rule: NotificationRule;
  onUpdate: (input: { isEnabled?: boolean; commsWindowStart?: string; commsWindowEnd?: string }) => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{TRIGGER_LABEL[rule.triggerType]}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{TRIGGER_DESCRIPTION[rule.triggerType]}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={rule.isEnabled}
          onClick={() => onUpdate({ isEnabled: !rule.isEnabled })}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            rule.isEnabled ? "bg-primary-600" : "bg-gray-300"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              rule.isEnabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-gray-600">Allowed between</label>
        <Input
          type="time"
          value={rule.commsWindowStart}
          onChange={(e) => onUpdate({ commsWindowStart: e.target.value })}
          className="w-32"
          disabled={!rule.isEnabled}
        />
        <span className="text-sm text-gray-400">and</span>
        <Input
          type="time"
          value={rule.commsWindowEnd}
          onChange={(e) => onUpdate({ commsWindowEnd: e.target.value })}
          className="w-32"
          disabled={!rule.isEnabled}
        />
      </div>
    </Card>
  );
}
