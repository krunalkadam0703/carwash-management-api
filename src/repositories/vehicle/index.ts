import type { CreateVehicleInput, UpdateVehicleInput, VehicleRecord } from '../../models/vehicle.model.js';
import { vehicleCacheRepository } from './cache.js';
import { vehiclePersistentStorageRepository } from './persistent-storage.js';

export class VehicleRepository {
  async findManyByBusinessId(businessId: string, customerId?: string): Promise<VehicleRecord[]> {
    const cached = await vehicleCacheRepository.findMany(businessId, customerId);
    if (cached) return cached;

    const vehicles = await vehiclePersistentStorageRepository.findManyByBusinessId(businessId, customerId);
    await vehicleCacheRepository.saveMany(businessId, vehicles, customerId);
    return vehicles;
  }

  findById(businessId: string, id: string): Promise<VehicleRecord | null> {
    return vehiclePersistentStorageRepository.findById(businessId, id);
  }

  existsCustomerForBusiness(businessId: string, customerId: string): Promise<boolean> {
    return vehiclePersistentStorageRepository.existsCustomerForBusiness(businessId, customerId);
  }

  existsVehicleTypeForBusiness(businessId: string, vehicleTypeId: string): Promise<boolean> {
    return vehiclePersistentStorageRepository.existsVehicleTypeForBusiness(businessId, vehicleTypeId);
  }

  async create(input: CreateVehicleInput): Promise<VehicleRecord> {
    const vehicle = await vehiclePersistentStorageRepository.create(input);
    await vehicleCacheRepository.invalidateBusiness(input.businessId, input.customerId);
    return vehicle;
  }

  async update(input: UpdateVehicleInput, previousCustomerId: string): Promise<VehicleRecord> {
    const vehicle = await vehiclePersistentStorageRepository.update(input);
    await vehicleCacheRepository.invalidateBusiness(input.businessId, previousCustomerId);
    if (vehicle.customerId !== previousCustomerId) await vehicleCacheRepository.invalidateBusiness(input.businessId, vehicle.customerId);
    return vehicle;
  }
}

export const vehicleRepository = new VehicleRepository();
