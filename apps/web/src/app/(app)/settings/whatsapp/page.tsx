"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toastError } from "@/store/toast-store";

export default function WhatsAppConnectionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">WhatsApp Connection</h1>

      <Card>
        <div className="flex items-center gap-3">
          <Badge tone="danger">Not connected</Badge>
          <span className="text-sm text-gray-500">No WhatsApp Business Account is linked to this school.</span>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Notifications sent from the &quot;Send Notification&quot; buttons across Attendance and Fees are currently{" "}
          <strong>simulated</strong> — they create a real record in the Notification Log with the resolved message
          and recipient, but nothing is delivered to an actual phone. To send real WhatsApp messages, this school
          needs a verified WhatsApp Business Account connected through a Business Solution Provider (Meta requires
          this — a direct Cloud API integration isn&apos;t practical per-school). That setup involves:
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>A Meta Business Manager account for the school</li>
          <li>Business verification with Meta (can take a few days to a few weeks)</li>
          <li>A BSP account (e.g. Wati, Gupshup, 360dialog) with Embedded Signup</li>
          <li>Approval of each message template used by the automated sends</li>
        </ul>

        <div className="mt-6">
          <Button
            variant="secondary"
            onClick={() =>
              toastError("WhatsApp connection isn't available in this build yet — see the checklist above.")
            }
          >
            Connect WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
}
