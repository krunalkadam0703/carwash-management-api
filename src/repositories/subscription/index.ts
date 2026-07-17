import type {
  CreateSubscriptionInput,
  SubscriptionRecord,
  UpdateSubscriptionStatusInput,
} from '../../models/subscription.model.js';
import type { PaginationInput, PaginatedResult } from '../../utils/pagination.js';
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

  findPageByBusinessId(
    businessId: string,
    input: PaginationInput,
    customerId?: string,
  ): Promise<PaginatedResult<SubscriptionRecord>> {
    return subscriptionPersistentStorageRepository.findPageByBusinessId(
      businessId,
      input,
      customerId,
    );
  }

  findById(businessId: string, id: string): Promise<SubscriptionRecord | null> {
    return subscriptionPersistentStorageRepository.findById(businessId, id);
  }

  findOpenByVehicle(
    businessId: string,
    customerId: string,
    vehicleId: string,
  ): Promise<SubscriptionRecord | null> {
    return subscriptionPersistentStorageRepository.findOpenByVehicle(
      businessId,
      customerId,
      vehicleId,
    );
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

  async activate(
    businessId: string,
    id: string,
    performedById: string,
    remarks?: string,
  ): Promise<SubscriptionRecord> {
    const row = await subscriptionPersistentStorageRepository.activate(
      businessId,
      id,
      performedById,
      remarks,
    );
    await subscriptionCacheRepository.invalidateBusiness(row.businessId, row.customerId);
    return row;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
