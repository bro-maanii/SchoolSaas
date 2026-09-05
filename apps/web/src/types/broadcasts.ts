export type AudienceType = "ALL" | "CLASS" | "SECTION" | "STUDENTS" | "ABSENT_TODAY" | "DEFAULTERS" | "STAFF";

export type AudiencePreview = {
  count: number;
  sample: { recipientPhone: string; variables: Record<string, string> } | null;
};

export type CreateBroadcastResult = {
  id: string;
  recipientCount: number;
  sampleMessage: string;
};

export type BroadcastListRow = {
  id: string;
  audienceType: AudienceType;
  templateName: string | null;
  rawBody: string | null;
  sentBy: string;
  sentAt: string;
  recipientCount: number;
  statusCounts: Record<string, number>;
};

export type BroadcastDelivery = {
  id: string;
  recipientPhone: string;
  status: string;
  updatedAt: string;
  error: string | null;
};

export type BroadcastDetail = {
  id: string;
  audienceType: AudienceType;
  audienceFilter: Record<string, unknown>;
  templateName: string | null;
  rawBody: string | null;
  sentBy: string;
  sentAt: string;
  deliveries: BroadcastDelivery[];
};
