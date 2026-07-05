import type { CreateServiceImageInput, CreateVehicleImageInput, ServiceImageRecord, VehicleImageRecord } from '../../models/image.model.js';
import { imagePersistentStorageRepository } from './persistent-storage.js';

export class ImageRepository {
  findVehicle(businessId: string, vehicleId: string): Promise<{ id: string; customerId: string } | null> {
    return imagePersistentStorageRepository.findVehicle(businessId, vehicleId);
  }

  findService(businessId: string, serviceId: string): Promise<{ id: string } | null> {
    return imagePersistentStorageRepository.findService(businessId, serviceId);
  }

  createVehicleImage(input: CreateVehicleImageInput): Promise<VehicleImageRecord> {
    return imagePersistentStorageRepository.createVehicleImage(input);
  }

  createServiceImage(input: CreateServiceImageInput): Promise<ServiceImageRecord> {
    return imagePersistentStorageRepository.createServiceImage(input);
  }
}

export const imageRepository = new ImageRepository();
