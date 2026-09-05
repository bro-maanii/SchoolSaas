"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSendAbsenceNotification } from "@/features/attendance/use-attendance";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import type { NotificationInfo } from "@/types/attendance";

/**
 * Manual, user-triggered send — nothing here fires automatically when a
 * student is marked absent. There's no live WhatsApp/BSP connection yet
 * (that's Phase 5 infrastructure), so clicking this simulates a successful
 * send and writes the same NotificationJob/MessageDelivery audit trail a
 * real provider call will use later.
 */
export function NotifyAbsenceButton({
  attendanceRecordId,
  notification,
}: {
  attendanceRecordId: string;
  notification: NotificationInfo;
}) {
  const sendNotification = useSendAbsenceNotification();

  if (notification) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="success">Sent {new Date(notification.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Badge>
        <Button
          variant="ghost"
          size="sm"
          disabled={sendNotification.isPending}
          onClick={() => handleSend()}
        >
          Resend
        </Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" disabled={sendNotification.isPending} onClick={() => handleSend()}>
      {sendNotification.isPending ? "Sending…" : "Send Notification"}
    </Button>
  );

  function handleSend() {
    sendNotification.mutate(attendanceRecordId, {
      onSuccess: (result) => {
        toastSuccess(`Notification sent to ${result.recipientPhone} (simulated — no live WhatsApp connection yet)`);
      },
      onError: (err) => {
        toastError(err instanceof ApiError ? err.message : "Failed to send notification");
      },
    });
  }
}
