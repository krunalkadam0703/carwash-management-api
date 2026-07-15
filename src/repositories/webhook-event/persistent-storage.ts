import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateWebhookEventInput,
  UpdateWebhookEventInput,
  WebhookEventRecord,
} from '../../models/webhook-event.model.js';

type WebhookDelegate = {
  findMany(args: unknown): Promise<WebhookEventRecord[]>;
  findFirst(args: unknown): Promise<WebhookEventRecord | null>;
  create(args: unknown): Promise<WebhookEventRecord>;
  update(args: unknown): Promise<WebhookEventRecord>;
};
type AppDb = { razorpayWebhookEvent: WebhookDelegate };

const db = prisma as unknown as AppDb;

export class WebhookEventPersistentStorageRepository {
  findMany(): Promise<WebhookEventRecord[]> {
    return db.razorpayWebhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  findById(id: string): Promise<WebhookEventRecord | null> {
    return db.razorpayWebhookEvent.findFirst({ where: { id } });
  }

  findByEventId(eventId: string): Promise<WebhookEventRecord | null> {
    return db.razorpayWebhookEvent.findFirst({ where: { eventId } });
  }

  create(input: CreateWebhookEventInput): Promise<WebhookEventRecord> {
    return db.razorpayWebhookEvent.create({ data: input });
  }

  update(input: UpdateWebhookEventInput): Promise<WebhookEventRecord> {
    return db.razorpayWebhookEvent.update({
      where: { id: input.id },
      data: {
        processed: input.processed,
        errorMessage: input.errorMessage,
        processedAt: new Date(),
      },
    });
  }
}

export const webhookEventPersistentStorageRepository =
  new WebhookEventPersistentStorageRepository();
