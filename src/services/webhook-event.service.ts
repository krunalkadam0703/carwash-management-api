import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { WebhookEventRecord } from '../models/webhook-event.model.js';
import { webhookEventRepository } from '../repositories/webhook-event/index.js';
import { AppError } from '../utils/app-error.js';

export class WebhookEventService {
  async list(user: AppUser): Promise<WebhookEventRecord[]> {
    this.requireOwnerOrAdmin(user);
    return webhookEventRepository.findMany();
  }

  async ingest(input: { eventId: string; eventType: string; payload: unknown }): Promise<WebhookEventRecord> {
    const existing = await webhookEventRepository.findByEventId(input.eventId);
    if (existing) return existing;
    return webhookEventRepository.create(input);
  }

  async markProcessed(user: AppUser, id: string): Promise<WebhookEventRecord> {
    this.requireOwnerOrAdmin(user);
    await this.requireEvent(id);
    return webhookEventRepository.update({ id, processed: true, errorMessage: null });
  }

  async markFailed(user: AppUser, id: string, errorMessage: string): Promise<WebhookEventRecord> {
    this.requireOwnerOrAdmin(user);
    await this.requireEvent(id);
    return webhookEventRepository.update({ id, processed: false, errorMessage });
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  private async requireEvent(id: string): Promise<WebhookEventRecord> {
    const event = await webhookEventRepository.findById(id);
    if (!event) throw new AppError('Webhook event was not found.', HttpStatus.NOT_FOUND);
    return event;
  }

  private requireOwnerOrAdmin(user: AppUser): void {
    if (!['OWNER', 'SYSTEM_ADMIN'].includes(user.role)) throw new AppError('Only owners can manage webhook events.', HttpStatus.FORBIDDEN);
  }
}

export const webhookEventService = new WebhookEventService();
