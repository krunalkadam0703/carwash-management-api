import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { webhookEventService } from '../services/webhook-event.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class WebhookEventController {
  list = async (req: Request, res: Response): Promise<void> => {
    const events = await webhookEventService.list(this.user(req));
    ApiResponse.success(res, { events }, 'Webhook events loaded.');
  };

  ingestRazorpay = async (req: Request, res: Response): Promise<void> => {
    const request = req as Request & { rawBody?: Buffer };
    const event = await webhookEventService.ingestRazorpay({
      eventId: webhookEventService.text(req.body.eventId ?? req.body.id, 'eventId'),
      eventType: webhookEventService.text(req.body.eventType ?? req.body.event, 'eventType'),
      payload: req.body,
      rawBody: request.rawBody,
      signature:
        typeof req.headers['x-razorpay-signature'] === 'string'
          ? req.headers['x-razorpay-signature']
          : undefined,
    });
    ApiResponse.success(res, { event }, 'Webhook event recorded.', HttpStatus.CREATED);
  };

  markProcessed = async (req: Request, res: Response): Promise<void> => {
    const event = await webhookEventService.markProcessed(
      this.user(req),
      webhookEventService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { event }, 'Webhook event marked processed.');
  };

  markFailed = async (req: Request, res: Response): Promise<void> => {
    const event = await webhookEventService.markFailed(
      this.user(req),
      webhookEventService.text(req.params.id, 'id'),
      webhookEventService.text(req.body.errorMessage, 'errorMessage'),
    );
    ApiResponse.success(res, { event }, 'Webhook event marked failed.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const webhookEventController = new WebhookEventController();
