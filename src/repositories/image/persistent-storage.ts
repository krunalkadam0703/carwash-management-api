import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateServiceImageInput,
  CreateVehicleImageInput,
  ServiceImageRecord,
  VehicleImageRecord,
} from '../../models/image.model.js';

type VehicleDelegate = {
  findFirst(args: unknown): Promise<{ id: string; customerId: string } | null>;
};
type ServiceDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type VehiclePhotoDelegate = { create(args: unknown): Promise<VehicleImageRecord> };
type ServiceImageDelegate = { create(args: unknown): Promise<ServiceImageRecord> };
type AppDb = {
  vehicle: VehicleDelegate;
  service: ServiceDelegate;
  vehiclePhoto: VehiclePhotoDelegate;
  serviceImage: ServiceImageDelegate;
};

const db = prisma as unknown as AppDb;

export class ImagePersistentStorageRepository {
  findVehicle(
    businessId: string,
    vehicleId: string,
  ): Promise<{ id: string; customerId: string } | null> {
    return db.vehicle.findFirst({
      where: { id: vehicleId, businessId },
      select: { id: true, customerId: true },
    });
  }

  findService(businessId: string, serviceId: string): Promise<{ id: string } | null> {
    return db.service.findFirst({ where: { id: serviceId, businessId }, select: { id: true } });
  }

  createVehicleImage(input: CreateVehicleImageInput): Promise<VehicleImageRecord> {
    return db.vehiclePhoto.create({ data: input });
  }

  createServiceImage(input: CreateServiceImageInput): Promise<ServiceImageRecord> {
    return db.serviceImage.create({ data: input });
  }
}

export const imagePersistentStorageRepository = new ImagePersistentStorageRepository();
