"use client";

import { Button } from "@/components/ui/button";
import { useSendFeeReminder } from "@/features/fees/use-fees";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";

/**
 * Manual, user-triggered — same pattern as the attendance absence notifier.
 * No live WhatsApp connection yet, so this simulates a successful send while
 * writing the real NotificationJob/MessageDelivery audit trail.
 */
export function NotifyFeeButton({ invoiceId }: { invoiceId: string }) {
  const sendReminder = useSendFeeReminder();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={sendReminder.isPending}
      onClick={() =>
        sendReminder.mutate(invoiceId, {
          onSuccess: (result) => {
            const label = result.triggerType === "FEE_OVERDUE" ? "Overdue notice" : "Reminder";
            toastSuccess(`${label} sent to ${result.recipientPhone} (simulated — no live WhatsApp connection yet)`);
          },
          onError: (err) => {
            toastError(err instanceof ApiError ? err.message : "Failed to send reminder");
          },
        })
      }
    >
      {sendReminder.isPending ? "Sending…" : "Send Reminder"}
    </Button>
  );
}
