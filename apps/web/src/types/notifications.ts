export type TriggerType = "ABSENCE" | "FEE_REMINDER" | "FEE_OVERDUE";
export type DeliveryStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export type NotificationLogRow = {
  id: string;
  triggerType: TriggerType;
  status: string;
  scheduledFor: string;
  student: { id: string; fullName: string; rollNumber: string } | null;
  templateName: string | null;
  delivery: {
    status: DeliveryStatus;
    recipientPhone: string;
    updatedAt: string;
    error: string | null;
  } | null;
};

export type MessageTemplate = {
  id: string;
  name: string;
  category: TriggerType | "ANNOUNCEMENT" | "CUSTOM";
  bodyText: string;
  approvalStatus: string;
};

export type NotificationRule = {
  id: string;
  triggerType: TriggerType;
  isEnabled: boolean;
  commsWindowStart: string;
  commsWindowEnd: string;
};
