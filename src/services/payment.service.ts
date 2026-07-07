import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type {
  PaymentRecord,
  RazorpayCheckoutOrder,
  StartSubscriptionPaymentResult,
} from '../models/payment.model.js';
import { paymentRepository } from '../repositories/payment/index.js';
import { auditLogService } from './audit-log.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/app-error.js';
import { createHmac } from 'node:crypto';

export class PaymentService {
  async list(user: AppUser, subscriptionId?: string): Promise<PaymentRecord[]> {
    const businessId = this.requireBusinessId(user);
    return paymentRepository.findManyByBusinessId(
      businessId,
      user.role === 'CUSTOMER' ? user.id : undefined,
      subscriptionId,
    );
  }

  async createForSubscription(
    user: AppUser,
    subscriptionId: string,
  ): Promise<StartSubscriptionPaymentResult> {
    if (user.role !== 'CUSTOMER')
      throw new AppError('Only customers can start subscription payments.', HttpStatus.FORBIDDEN);
    const businessId = this.requireBusinessId(user);
    const subscription = await paymentRepository.findSubscription(businessId, subscriptionId);
    if (!subscription || subscription.customerId !== user.id)
      throw new AppError('Subscription was not found.', HttpStatus.NOT_FOUND);
    if (!['APPROVED', 'PAYMENT_PENDING'].includes(subscription.status))
      throw new AppError('Subscription is not ready for payment.', HttpStatus.CONFLICT);

    let payment = await paymentRepository.createSubscriptionPayment({
      businessId,
      customerId: user.id,
      subscriptionId,
      amount: Number(subscription.amount.toString()),
      receiptId: `sub_${subscriptionId}_${Date.now()}`,
    });
    const gateway = await this.createRazorpayOrder(payment);
    if (gateway)
      payment = await paymentRepository.attachRazorpayOrder({
        id: payment.id,
        businessId,
        razorpayOrderId: gateway.orderId,
      });
    await auditLogService.create({
      businessId,
      userId: user.id,
      action: 'START_SUBSCRIPTION_PAYMENT',
      entityType: 'Payment',
      entityId: payment.id,
      newData: { subscriptionId, amount: payment.amount },
    });
    await notificationService.create({
      userId: user.id,
      type: 'PAYMENT_PENDING',
      title: 'Payment started',
      message: 'Your subscription payment is pending.',
      actionUrl: `/customer/plans`,
      metadata: { paymentId: payment.id, subscriptionId },
    });
    return { payment, gateway };
  }

  async complete(
    user: AppUser,
    id: string,
    input: {
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      paymentMethod?: string;
      upiRef?: string;
    },
  ): Promise<PaymentRecord> {
    const payment = await this.requirePayment(user, id);
    if (payment.status !== 'PENDING')
      throw new AppError('Only pending payments can be completed.', HttpStatus.CONFLICT);
    if (!payment.subscriptionId)
      throw new AppError('Payment is not linked to a subscription.', HttpStatus.BAD_REQUEST);
    this.verifyRazorpaySignature(payment, input);

    const subscription = await paymentRepository.findSubscription(
      payment.businessId,
      payment.subscriptionId,
    );
    if (!subscription) throw new AppError('Subscription was not found.', HttpStatus.NOT_FOUND);
    const completed = await paymentRepository.complete(
      { ...input, id, businessId: payment.businessId },
    );
    await auditLogService.create({
      businessId: completed.businessId,
      userId: user.id,
      action: 'COMPLETE_PAYMENT',
      entityType: 'Payment',
      entityId: completed.id,
      oldData: { status: payment.status },
      newData: { status: completed.status, subscriptionId: completed.subscriptionId },
    });
    await notificationService.create({
      userId: completed.customerId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment successful',
      message: 'Your payment is complete. The owner will activate your subscription.',
      actionUrl: `/customer/plans`,
      metadata: { paymentId: completed.id, subscriptionId: completed.subscriptionId },
    });
    return completed;
  }

  async fail(user: AppUser, id: string, failureReason?: string): Promise<PaymentRecord> {
    const payment = await this.requirePayment(user, id);
    if (payment.status !== 'PENDING')
      throw new AppError('Only pending payments can be failed.', HttpStatus.CONFLICT);
    const failed = await paymentRepository.fail({
      id,
      businessId: payment.businessId,
      failureReason,
    });
    await auditLogService.create({
      businessId: failed.businessId,
      userId: user.id,
      action: 'FAIL_PAYMENT',
      entityType: 'Payment',
      entityId: failed.id,
      oldData: { status: payment.status },
      newData: { status: failed.status, failureReason },
    });
    await notificationService.create({
      userId: failed.customerId,
      type: 'PAYMENT_FAILED',
      title: 'Payment failed',
      message: failureReason ?? 'Your payment could not be completed.',
      actionUrl: `/customer/plans`,
      metadata: { paymentId: failed.id, subscriptionId: failed.subscriptionId },
    });
    return failed;
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private async requirePayment(user: AppUser, id: string): Promise<PaymentRecord> {
    const payment = await paymentRepository.findById(this.requireBusinessId(user), id);
    if (!payment || (user.role === 'CUSTOMER' && payment.customerId !== user.id))
      throw new AppError('Payment was not found.', HttpStatus.NOT_FOUND);
    return payment;
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }

  private async createRazorpayOrder(
    payment: PaymentRecord,
  ): Promise<RazorpayCheckoutOrder | undefined> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return undefined;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(payment.amount) * 100),
        currency: payment.currency || 'INR',
        receipt: payment.receiptId,
        notes: { paymentId: payment.id, subscriptionId: payment.subscriptionId },
      }),
    });
    const body = (await response.json().catch(() => null)) as {
      id?: string;
      amount?: number;
      currency?: string;
      error?: { description?: string };
    } | null;
    if (!response.ok || !body?.id)
      throw new AppError(
        body?.error?.description || 'Failed to create Razorpay order.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return {
      keyId,
      orderId: body.id,
      amount: body.amount ?? Math.round(Number(payment.amount) * 100),
      currency: body.currency ?? 'INR',
    };
  }

  private verifyRazorpaySignature(
    payment: PaymentRecord,
    input: { razorpayPaymentId?: string; razorpaySignature?: string },
  ): void {
    if (!payment.razorpayOrderId && !input.razorpayPaymentId && !input.razorpaySignature) return;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret)
      throw new AppError('Razorpay secret is not configured.', HttpStatus.INTERNAL_SERVER_ERROR);
    if (!payment.razorpayOrderId)
      throw new AppError('Payment is missing a Razorpay order id.', HttpStatus.CONFLICT);
    if (!input.razorpayPaymentId || !input.razorpaySignature)
      throw new AppError('Razorpay payment id and signature are required.', HttpStatus.BAD_REQUEST);
    const expected = createHmac('sha256', keySecret)
      .update(`${payment.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest('hex');
    if (expected !== input.razorpaySignature)
      throw new AppError('Invalid Razorpay payment signature.', HttpStatus.BAD_REQUEST);
  }
}

export const paymentService = new PaymentService();
