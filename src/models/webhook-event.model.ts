export type WebhookEventRecord = {
  id: string;
  eventId: string;
  eventType: string;
  payload: unknown;
  processed: boolean;
  errorMessage?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
};

export type CreateWebhookEventInput = {
  eventId: string;
  eventType: string;
  payload: unknown;
};

export type UpdateWebhookEventInput = {
  id: string;
  processed: boolean;
  errorMessage?: string | null;
};
