import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { paymentService } from '../services/payment.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class PaymentController {
  list = async (req: Request, res: Response): Promise<void> => {
    const payments = await paymentService.list(this.user(req));
    ApiResponse.success(res, { payments }, 'Payments loaded.');
  };

  createSubscriptionPayment = async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.createForSubscription(this.user(req), paymentService.text(req.params.subscriptionId, 'subscriptionId'));
    ApiResponse.success(res, result, 'Subscription payment created.', HttpStatus.CREATED);
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const payment = await paymentService.complete(this.user(req), paymentService.text(req.params.id, 'id'), {
      razorpayPaymentId: paymentService.optText(req.body.razorpayPaymentId),
      razorpaySignature: paymentService.optText(req.body.razorpaySignature),
      paymentMethod: paymentService.optText(req.body.paymentMethod),
      upiRef: paymentService.optText(req.body.upiRef),
    });

    ApiResponse.success(res, { payment }, 'Payment completed.');
  };

  fail = async (req: Request, res: Response): Promise<void> => {
    const payment = await paymentService.fail(
      this.user(req),
      paymentService.text(req.params.id, 'id'),
      paymentService.optText(req.body.failureReason),
    );

    ApiResponse.success(res, { payment }, 'Payment failed.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const paymentController = new PaymentController();
