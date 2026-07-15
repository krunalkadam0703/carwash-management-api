import type {
  CreateWebhookEventInput,
  UpdateWebhookEventInput,
  WebhookEventRecord,
} from '../../models/webhook-event.model.js';
import { webhookEventPersistentStorageRepository } from './persistent-storage.js';

export class WebhookEventRepository {
  findMany(): Promise<WebhookEventRecord[]> {
    return webhookEventPersistentStorageRepository.findMany();
  }

  findById(id: string): Promise<WebhookEventRecord | null> {
    return webhookEventPersistentStorageRepository.findById(id);
  }

  findByEventId(eventId: string): Promise<WebhookEventRecord | null> {
    return webhookEventPersistentStorageRepository.findByEventId(eventId);
  }

  create(input: CreateWebhookEventInput): Promise<WebhookEventRecord> {
    return webhookEventPersistentStorageRepository.create(input);
  }

  update(input: UpdateWebhookEventInput): Promise<WebhookEventRecord> {
    return webhookEventPersistentStorageRepository.update(input);
  }
}

export const webhookEventRepository = new WebhookEventRepository();
