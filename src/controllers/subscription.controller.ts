import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { subscriptionService } from '../services/subscription.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class SubscriptionController {
  list = async (req: Request, res: Response): Promise<void> => {
    const subscriptions = await subscriptionService.list(this.user(req));
    ApiResponse.success(res, { subscriptions }, 'Subscriptions loaded.');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const subscription = await subscriptionService.getById(
      this.user(req),
      subscriptionService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { subscription }, 'Subscription loaded.');
  };

  request = async (req: Request, res: Response): Promise<void> => {
    const subscription = await subscriptionService.request(this.user(req), {
      vehicleId: subscriptionService.text(req.body.vehicleId, 'vehicleId'),
      planId: subscriptionService.text(req.body.planId, 'planId'),
      suggestedPlanId: subscriptionService.optText(req.body.suggestedPlanId),
      autoRenew: subscriptionService.optBool(req.body.autoRenew),
    });

    ApiResponse.success(res, { subscription }, 'Subscription requested.', HttpStatus.CREATED);
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    const subscription = await subscriptionService.approve(
      this.user(req),
      subscriptionService.text(req.params.id, 'id'),
      subscriptionService.optText(req.body.remarks),
    );

    ApiResponse.success(res, { subscription }, 'Subscription approved.');
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    const subscription = await subscriptionService.reject(
      this.user(req),
      subscriptionService.text(req.params.id, 'id'),
      subscriptionService.text(req.body.reason, 'reason'),
    );

    ApiResponse.success(res, { subscription }, 'Subscription rejected.');
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const subscription = await subscriptionService.activate(
      this.user(req),
      subscriptionService.text(req.params.id, 'id'),
      subscriptionService.optText(req.body.remarks),
    );

    ApiResponse.success(res, { subscription }, 'Subscription activated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const subscriptionController = new SubscriptionController();
