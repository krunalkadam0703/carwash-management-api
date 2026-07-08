import type {
  CreateDailyWashImageInput,
  CreateServiceImageInput,
  CreateVehicleImageInput,
  DailyWashImageRecord,
  ServiceImageRecord,
  VehicleImageRecord,
} from '../../models/image.model.js';
import { imagePersistentStorageRepository } from './persistent-storage.js';

export class ImageRepository {
  findVehicle(
    businessId: string,
    vehicleId: string,
  ): Promise<{ id: string; customerId: string } | null> {
    return imagePersistentStorageRepository.findVehicle(businessId, vehicleId);
  }

  findService(businessId: string, serviceId: string): Promise<{ id: string } | null> {
    return imagePersistentStorageRepository.findService(businessId, serviceId);
  }

  findDailyWash(businessId: string, dailyWashId: string) {
    return imagePersistentStorageRepository.findDailyWash(businessId, dailyWashId);
  }

  findVehicleImages(vehicleId: string): Promise<VehicleImageRecord[]> {
    return imagePersistentStorageRepository.findVehicleImages(vehicleId);
  }

  createVehicleImage(input: CreateVehicleImageInput): Promise<VehicleImageRecord> {
    return imagePersistentStorageRepository.createVehicleImage(input);
  }

  createServiceImage(input: CreateServiceImageInput): Promise<ServiceImageRecord> {
    return imagePersistentStorageRepository.createServiceImage(input);
  }

  createDailyWashImage(input: CreateDailyWashImageInput): Promise<DailyWashImageRecord> {
    return imagePersistentStorageRepository.createDailyWashImage(input);
  }

  findDailyWashImages(dailyWashId: string): Promise<DailyWashImageRecord[]> {
    return imagePersistentStorageRepository.findDailyWashImages(dailyWashId);
  }
}

export const imageRepository = new ImageRepository();
