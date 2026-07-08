import type {
  AttachRazorpayOrderInput,
  CompletePaymentInput,
  CompleteWebhookPaymentInput,
  CreateSubscriptionPaymentInput,
  FailPaymentInput,
  FailWebhookPaymentInput,
  PaymentRecord,
} from '../../models/payment.model.js';
import { subscriptionCacheRepository } from '../subscription/cache.js';
import { paymentPersistentStorageRepository } from './persistent-storage.js';

export class PaymentRepository {
  findManyByBusinessId(
    businessId: string,
    customerId?: string,
    subscriptionId?: string,
  ): Promise<PaymentRecord[]> {
    return paymentPersistentStorageRepository.findManyByBusinessId(
      businessId,
      customerId,
      subscriptionId,
    );
  }

  findById(businessId: string, id: string): Promise<PaymentRecord | null> {
    return paymentPersistentStorageRepository.findById(businessId, id);
  }

  findSubscription(businessId: string, subscriptionId: string) {
    return paymentPersistentStorageRepository.findSubscription(businessId, subscriptionId);
  }

  async createSubscriptionPayment(input: CreateSubscriptionPaymentInput): Promise<PaymentRecord> {
    const payment = await paymentPersistentStorageRepository.createSubscriptionPayment(input);
    await subscriptionCacheRepository.invalidateBusiness(payment.businessId, payment.customerId);
    return payment;
  }

  attachRazorpayOrder(input: AttachRazorpayOrderInput): Promise<PaymentRecord> {
    return paymentPersistentStorageRepository.attachRazorpayOrder(input);
  }

  async complete(input: CompletePaymentInput): Promise<PaymentRecord> {
    const payment = await paymentPersistentStorageRepository.complete(input);
    await subscriptionCacheRepository.invalidateBusiness(payment.businessId, payment.customerId);
    return payment;
  }

  async fail(input: FailPaymentInput): Promise<PaymentRecord> {
    const payment = await paymentPersistentStorageRepository.fail(input);
    await subscriptionCacheRepository.invalidateBusiness(payment.businessId, payment.customerId);
    return payment;
  }

  async completeFromWebhook(input: CompleteWebhookPaymentInput): Promise<PaymentRecord | null> {
    const payment = await paymentPersistentStorageRepository.completeFromWebhook(input);
    if (payment)
      await subscriptionCacheRepository.invalidateBusiness(payment.businessId, payment.customerId);
    return payment;
  }

  async failFromWebhook(input: FailWebhookPaymentInput): Promise<PaymentRecord | null> {
    const payment = await paymentPersistentStorageRepository.failFromWebhook(input);
    if (payment)
      await subscriptionCacheRepository.invalidateBusiness(payment.businessId, payment.customerId);
    return payment;
  }
}

export const paymentRepository = new PaymentRepository();
