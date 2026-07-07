import type {
  CreateServiceInput,
  ServiceRecord,
  UpdateServiceInput,
} from '../../models/service.model.js';
import { serviceCacheRepository } from './cache.js';
import { servicePersistentStorageRepository } from './persistent-storage.js';

export class ServiceRepository {
  async findManyByBusinessId(businessId: string): Promise<ServiceRecord[]> {
    const cachedServices = await serviceCacheRepository.findManyByBusinessId(businessId);

    if (cachedServices) {
      return cachedServices;
    }

    const services = await servicePersistentStorageRepository.findManyByBusinessId(businessId);
    await serviceCacheRepository.saveMany(businessId, services);
    return services;
  }

  async findById(businessId: string, id: string): Promise<ServiceRecord | null> {
    const cachedService = await serviceCacheRepository.findById(businessId, id);

    if (cachedService) {
      return cachedService;
    }

    const service = await servicePersistentStorageRepository.findById(businessId, id);

    if (service) {
      await serviceCacheRepository.save(service);
    }

    return service;
  }

  existsVehicleTypeForBusiness(businessId: string, vehicleTypeId: string): Promise<boolean> {
    return servicePersistentStorageRepository.existsVehicleTypeForBusiness(
      businessId,
      vehicleTypeId,
    );
  }

  async create(input: CreateServiceInput): Promise<ServiceRecord> {
    const service = await servicePersistentStorageRepository.create(input);
    await Promise.all([
      serviceCacheRepository.save(service),
      serviceCacheRepository.invalidateBusiness(service.businessId),
    ]);
    return service;
  }

  async update(input: UpdateServiceInput): Promise<ServiceRecord> {
    const service = await servicePersistentStorageRepository.update(input);
    await Promise.all([
      serviceCacheRepository.save(service),
      serviceCacheRepository.invalidateBusiness(service.businessId),
    ]);
    return service;
  }

  async delete(businessId: string, id: string): Promise<ServiceRecord> {
    const service = await servicePersistentStorageRepository.delete(id);
    await Promise.all([
      serviceCacheRepository.invalidateService(businessId, id),
      serviceCacheRepository.invalidateBusiness(businessId),
    ]);
    return service;
  }
}

export const serviceRepository = new ServiceRepository();
