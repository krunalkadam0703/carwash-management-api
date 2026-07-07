import type {
  AttachRazorpayOrderInput,
  CompletePaymentInput,
  CreateSubscriptionPaymentInput,
  FailPaymentInput,
  PaymentRecord,
} from '../../models/payment.model.js';
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

  createSubscriptionPayment(input: CreateSubscriptionPaymentInput): Promise<PaymentRecord> {
    return paymentPersistentStorageRepository.createSubscriptionPayment(input);
  }

  attachRazorpayOrder(input: AttachRazorpayOrderInput): Promise<PaymentRecord> {
    return paymentPersistentStorageRepository.attachRazorpayOrder(input);
  }

  complete(input: CompletePaymentInput): Promise<PaymentRecord> {
    return paymentPersistentStorageRepository.complete(input);
  }

  fail(input: FailPaymentInput): Promise<PaymentRecord> {
    return paymentPersistentStorageRepository.fail(input);
  }
}

export const paymentRepository = new PaymentRepository();
