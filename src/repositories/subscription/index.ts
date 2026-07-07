import type {
  CreateSubscriptionInput,
  SubscriptionRecord,
  UpdateSubscriptionStatusInput,
} from '../../models/subscription.model.js';
import { subscriptionCacheRepository } from './cache.js';
import { subscriptionPersistentStorageRepository } from './persistent-storage.js';

export class SubscriptionRepository {
  async findManyByBusinessId(
    businessId: string,
    customerId?: string,
  ): Promise<SubscriptionRecord[]> {
    const cached = await subscriptionCacheRepository.findMany(businessId, customerId);
    if (cached) return cached;

    const rows = await subscriptionPersistentStorageRepository.findManyByBusinessId(
      businessId,
      customerId,
    );
    await subscriptionCacheRepository.saveMany(businessId, rows, customerId);
    return rows;
  }

  findById(businessId: string, id: string): Promise<SubscriptionRecord | null> {
    return subscriptionPersistentStorageRepository.findById(businessId, id);
  }

  findVehicle(
    businessId: string,
    vehicleId: string,
  ): Promise<{ id: string; customerId: string } | null> {
    return subscriptionPersistentStorageRepository.findVehicle(businessId, vehicleId);
  }

  findPlan(
    businessId: string,
    planId: string,
  ): Promise<{ id: string; price: { toString(): string } } | null> {
    return subscriptionPersistentStorageRepository.findPlan(businessId, planId);
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionRecord> {
    const row = await subscriptionPersistentStorageRepository.create(input);
    await subscriptionCacheRepository.invalidateBusiness(input.businessId, input.customerId);
    return row;
  }

  async updateStatus(
    input: UpdateSubscriptionStatusInput,
    performedById: string,
    remarks?: string,
  ): Promise<SubscriptionRecord> {
    const row = await subscriptionPersistentStorageRepository.updateStatus(
      input,
      performedById,
      remarks,
    );
    await subscriptionCacheRepository.invalidateBusiness(row.businessId, row.customerId);
    return row;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
