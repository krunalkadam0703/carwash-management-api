import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { WebhookEventRecord } from '../models/webhook-event.model.js';
import { paymentRepository } from '../repositories/payment/index.js';
import { webhookEventRepository } from '../repositories/webhook-event/index.js';
import { AppError } from '../utils/app-error.js';
import { createHmac } from 'node:crypto';

type RazorpayEntity = {
  id?: string;
  order_id?: string;
  method?: string;
  error_description?: string;
  error_reason?: string;
  notes?: { paymentId?: string; subscriptionId?: string };
};
type RazorpayPayload = {
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
};

export class WebhookEventService {
  async list(user: AppUser): Promise<WebhookEventRecord[]> {
    this.requireOwnerOrAdmin(user);
    return webhookEventRepository.findMany();
  }

  async ingest(input: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }): Promise<WebhookEventRecord> {
    const existing = await webhookEventRepository.findByEventId(input.eventId);
    if (existing) return existing;
    return webhookEventRepository.create(input);
  }

  async ingestRazorpay(input: {
    eventId: string;
    eventType: string;
    payload: unknown;
    rawBody?: Buffer;
    signature?: string;
  }): Promise<WebhookEventRecord> {
    this.verifyRazorpaySignature(input.rawBody, input.signature);
    const existing = await webhookEventRepository.findByEventId(input.eventId);
    if (existing?.processed) return existing;
    const event = existing ?? (await webhookEventRepository.create(input));
    try {
      await this.processRazorpayEvent(input.eventType, input.payload);
      return webhookEventRepository.update({ id: event.id, processed: true, errorMessage: null });
    } catch (error) {
      return webhookEventRepository.update({
        id: event.id,
        processed: false,
        errorMessage: error instanceof Error ? error.message : 'Webhook processing failed.',
      });
    }
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
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  private async requireEvent(id: string): Promise<WebhookEventRecord> {
    const event = await webhookEventRepository.findById(id);
    if (!event) throw new AppError('Webhook event was not found.', HttpStatus.NOT_FOUND);
    return event;
  }

  private requireOwnerOrAdmin(user: AppUser): void {
    if (!['OWNER', 'SYSTEM_ADMIN'].includes(user.role))
      throw new AppError('Only owners can manage webhook events.', HttpStatus.FORBIDDEN);
  }

  private verifyRazorpaySignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): void {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return;
    if (!rawBody || !signature)
      throw new AppError('Razorpay webhook signature is required.', HttpStatus.BAD_REQUEST);
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected !== signature)
      throw new AppError('Invalid Razorpay webhook signature.', HttpStatus.BAD_REQUEST);
  }

  private async processRazorpayEvent(eventType: string, payload: unknown): Promise<void> {
    const data = payload as RazorpayPayload;
    const payment = data.payload?.payment?.entity;
    const order = data.payload?.order?.entity;
    const entity = payment ?? order;
    const paymentId = entity?.notes?.paymentId;
    const razorpayOrderId = payment?.order_id ?? order?.id;
    const razorpayPaymentId = payment?.id;

    if (['payment.captured', 'payment.authorized', 'order.paid'].includes(eventType)) {
      const row = await paymentRepository.completeFromWebhook({
        paymentId,
        razorpayOrderId,
        razorpayPaymentId,
        paymentMethod: payment?.method ?? 'razorpay',
      });
      if (!row) throw new Error('Payment row was not found for Razorpay success webhook.');
      return;
    }

    if (eventType === 'payment.failed') {
      const row = await paymentRepository.failFromWebhook({
        paymentId,
        razorpayOrderId,
        razorpayPaymentId,
        failureReason:
          payment?.error_description ?? payment?.error_reason ?? 'Razorpay payment failed.',
      });
      if (!row) throw new Error('Payment row was not found for Razorpay failed webhook.');
    }
  }
}

export const webhookEventService = new WebhookEventService();
