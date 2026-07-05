import type { CreatePlanInput, PlanRecord, UpdatePlanInput } from '../../models/plan.model.js';
import { planCacheRepository } from './cache.js';
import { planPersistentStorageRepository } from './persistent-storage.js';

export class PlanRepository {
  async findManyByBusinessId(businessId: string, activeOnly = false): Promise<PlanRecord[]> {
    const cached = await planCacheRepository.findMany(businessId, activeOnly);
    if (cached) return cached;

    const plans = await planPersistentStorageRepository.findManyByBusinessId(businessId, activeOnly);
    await planCacheRepository.saveMany(businessId, plans, activeOnly);
    return plans;
  }

  findById(businessId: string, id: string): Promise<PlanRecord | null> {
    return planPersistentStorageRepository.findById(businessId, id);
  }

  existsVehicleTypeForBusiness(businessId: string, vehicleTypeId: string): Promise<boolean> {
    return planPersistentStorageRepository.existsVehicleTypeForBusiness(businessId, vehicleTypeId);
  }

  countServicesForBusiness(businessId: string, serviceIds: string[]): Promise<number> {
    return planPersistentStorageRepository.countServicesForBusiness(businessId, serviceIds);
  }

  async create(input: CreatePlanInput): Promise<PlanRecord> {
    const plan = await planPersistentStorageRepository.create(input);
    await planCacheRepository.invalidateBusiness(input.businessId);
    return plan;
  }

  async update(input: UpdatePlanInput): Promise<PlanRecord> {
    const plan = await planPersistentStorageRepository.update(input);
    await planCacheRepository.invalidateBusiness(input.businessId);
    return plan;
  }
}

export const planRepository = new PlanRepository();
