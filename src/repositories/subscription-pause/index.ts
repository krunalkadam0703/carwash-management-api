import type {
  CreateSubscriptionPauseInput,
  PauseSubscriptionRecord,
  SubscriptionPauseRecord,
} from '../../models/subscription-pause.model.js';
import { subscriptionPausePersistentStorageRepository } from './persistent-storage.js';

export class SubscriptionPauseRepository {
  findManyByBusinessId(
    businessId: string,
    customerId?: string,
  ): Promise<SubscriptionPauseRecord[]> {
    return subscriptionPausePersistentStorageRepository.findManyByBusinessId(
      businessId,
      customerId,
    );
  }

  findSubscription(
    businessId: string,
    subscriptionId: string,
  ): Promise<PauseSubscriptionRecord | null> {
    return subscriptionPausePersistentStorageRepository.findSubscription(
      businessId,
      subscriptionId,
    );
  }

  create(input: CreateSubscriptionPauseInput): Promise<SubscriptionPauseRecord> {
    return subscriptionPausePersistentStorageRepository.create(input);
  }
}

export const subscriptionPauseRepository = new SubscriptionPauseRepository();
