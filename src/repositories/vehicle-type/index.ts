import type {
  CreateVehicleTypeInput,
  UpdateVehicleTypeInput,
  VehicleTypeRecord,
} from '../../models/vehicle-type.model.js';
import { vehicleTypeCacheRepository } from './cache.js';
import { vehicleTypePersistentStorageRepository } from './persistent-storage.js';

export class VehicleTypeRepository {
  async findManyByBusinessId(businessId: string): Promise<VehicleTypeRecord[]> {
    const cached = await vehicleTypeCacheRepository.findMany(businessId);

    if (cached) {
      return cached;
    }

    const vehicleTypes = await vehicleTypePersistentStorageRepository.findManyByBusinessId(businessId);
    await vehicleTypeCacheRepository.saveMany(businessId, vehicleTypes);
    return vehicleTypes;
  }

  async findById(businessId: string, id: string): Promise<VehicleTypeRecord | null> {
    return vehicleTypePersistentStorageRepository.findById(businessId, id);
  }

  findBySlug(businessId: string, slug: string): Promise<VehicleTypeRecord | null> {
    return vehicleTypePersistentStorageRepository.findBySlug(businessId, slug);
  }

  async create(input: CreateVehicleTypeInput): Promise<VehicleTypeRecord> {
    const vehicleType = await vehicleTypePersistentStorageRepository.create(input);
    await vehicleTypeCacheRepository.invalidateBusiness(input.businessId);
    return vehicleType;
  }

  async update(input: UpdateVehicleTypeInput): Promise<VehicleTypeRecord> {
    const vehicleType = await vehicleTypePersistentStorageRepository.update(input);
    await vehicleTypeCacheRepository.invalidateBusiness(input.businessId);
    return vehicleType;
  }
}

export const vehicleTypeRepository = new VehicleTypeRepository();
