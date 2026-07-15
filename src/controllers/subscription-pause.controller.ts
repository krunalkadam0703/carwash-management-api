import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { subscriptionPauseService } from '../services/subscription-pause.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class SubscriptionPauseController {
  list = async (req: Request, res: Response): Promise<void> => {
    const pauses = await subscriptionPauseService.list(this.user(req));
    ApiResponse.success(res, { pauses }, 'Subscription pauses loaded.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const pause = await subscriptionPauseService.create(this.user(req), {
      subscriptionId: subscriptionPauseService.text(req.body.subscriptionId, 'subscriptionId'),
      startDate: subscriptionPauseService.date(req.body.startDate, 'startDate'),
      endDate: subscriptionPauseService.date(req.body.endDate, 'endDate'),
      reason: subscriptionPauseService.optText(req.body.reason),
    });

    ApiResponse.success(res, { pause }, 'Subscription paused.', HttpStatus.CREATED);
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const subscriptionPauseController = new SubscriptionPauseController();
