import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { WebhookEventRecord } from '../models/webhook-event.model.js';
import { webhookEventRepository } from '../repositories/webhook-event/index.js';
import { AppError } from '../utils/app-error.js';
import { createHmac } from 'node:crypto';

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

  async ingestRazorpay(input: { eventId: string; eventType: string; payload: unknown; rawBody?: Buffer; signature?: string }): Promise<WebhookEventRecord> {
    this.verifyRazorpaySignature(input.rawBody, input.signature);
    return this.ingest(input);
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

  private verifyRazorpaySignature(rawBody: Buffer | undefined, signature: string | undefined): void {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return;
    if (!rawBody || !signature) throw new AppError('Razorpay webhook signature is required.', HttpStatus.BAD_REQUEST);
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected !== signature) throw new AppError('Invalid Razorpay webhook signature.', HttpStatus.BAD_REQUEST);
  }
}

export const webhookEventService = new WebhookEventService();
