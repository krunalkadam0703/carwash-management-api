import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { PaymentRecord } from '../models/payment.model.js';
import { paymentRepository } from '../repositories/payment/index.js';
import { AppError } from '../utils/app-error.js';

export class PaymentService {
  async list(user: AppUser): Promise<PaymentRecord[]> {
    const businessId = this.requireBusinessId(user);
    return paymentRepository.findManyByBusinessId(businessId, user.role === 'CUSTOMER' ? user.id : undefined);
  }

  async createForSubscription(user: AppUser, subscriptionId: string): Promise<PaymentRecord> {
    if (user.role !== 'CUSTOMER') throw new AppError('Only customers can start subscription payments.', HttpStatus.FORBIDDEN);
    const businessId = this.requireBusinessId(user);
    const subscription = await paymentRepository.findSubscription(businessId, subscriptionId);
    if (!subscription || subscription.customerId !== user.id) throw new AppError('Subscription was not found.', HttpStatus.NOT_FOUND);
    if (!['APPROVED', 'PAYMENT_PENDING'].includes(subscription.status)) throw new AppError('Subscription is not ready for payment.', HttpStatus.CONFLICT);

    return paymentRepository.createSubscriptionPayment({
      businessId,
      customerId: user.id,
      subscriptionId,
      amount: Number(subscription.amount.toString()),
      receiptId: `sub_${subscriptionId}_${Date.now()}`,
    });
  }

  async complete(user: AppUser, id: string, input: { razorpayPaymentId?: string; razorpaySignature?: string; paymentMethod?: string; upiRef?: string }): Promise<PaymentRecord> {
    const payment = await this.requirePayment(user, id);
    if (payment.status !== 'PENDING') throw new AppError('Only pending payments can be completed.', HttpStatus.CONFLICT);
    if (!payment.subscriptionId) throw new AppError('Payment is not linked to a subscription.', HttpStatus.BAD_REQUEST);

    const subscription = await paymentRepository.findSubscription(payment.businessId, payment.subscriptionId);
    if (!subscription) throw new AppError('Subscription was not found.', HttpStatus.NOT_FOUND);
    return paymentRepository.complete({ ...input, id, businessId: payment.businessId }, subscription.plan.durationDays);
  }

  async fail(user: AppUser, id: string, failureReason?: string): Promise<PaymentRecord> {
    const payment = await this.requirePayment(user, id);
    if (payment.status !== 'PENDING') throw new AppError('Only pending payments can be failed.', HttpStatus.CONFLICT);
    return paymentRepository.fail({ id, businessId: payment.businessId, failureReason });
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private async requirePayment(user: AppUser, id: string): Promise<PaymentRecord> {
    const payment = await paymentRepository.findById(this.requireBusinessId(user), id);
    if (!payment || (user.role === 'CUSTOMER' && payment.customerId !== user.id)) throw new AppError('Payment was not found.', HttpStatus.NOT_FOUND);
    return payment;
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const paymentService = new PaymentService();
