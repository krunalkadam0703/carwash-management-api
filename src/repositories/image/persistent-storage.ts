import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateDailyWashImageInput,
  CreateServiceImageInput,
  CreateVehicleImageInput,
  DailyWashImageRecord,
  ServiceImageRecord,
  VehicleImageRecord,
} from '../../models/image.model.js';

type VehicleDelegate = {
  findFirst(args: unknown): Promise<{ id: string; customerId: string } | null>;
};
type DailyWashDelegate = {
  findFirst(args: unknown): Promise<{ id: string; customerId: string; vehicleId: string; status: string } | null>;
};
type ServiceDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type VehiclePhotoDelegate = {
  create(args: unknown): Promise<VehicleImageRecord>;
  findMany(args: unknown): Promise<VehicleImageRecord[]>;
};
type ServiceImageDelegate = { create(args: unknown): Promise<ServiceImageRecord> };
type DailyWashPhotoDelegate = {
  create(args: unknown): Promise<DailyWashImageRecord>;
  findMany(args: unknown): Promise<DailyWashImageRecord[]>;
};
type AppDb = {
  vehicle: VehicleDelegate;
  dailyWashSchedule: DailyWashDelegate;
  service: ServiceDelegate;
  vehiclePhoto: VehiclePhotoDelegate;
  serviceImage: ServiceImageDelegate;
  dailyWashPhoto: DailyWashPhotoDelegate;
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

  findDailyWash(
    businessId: string,
    dailyWashId: string,
  ): Promise<{ id: string; customerId: string; vehicleId: string; status: string } | null> {
    return db.dailyWashSchedule.findFirst({
      where: { id: dailyWashId, businessId },
      select: { id: true, customerId: true, vehicleId: true, status: true },
    });
  }

  findVehicleImages(vehicleId: string): Promise<VehicleImageRecord[]> {
    return db.vehiclePhoto.findMany({ where: { vehicleId }, orderBy: { createdAt: 'desc' } });
  }

  createVehicleImage(input: CreateVehicleImageInput): Promise<VehicleImageRecord> {
    return db.vehiclePhoto.create({ data: input });
  }

  createServiceImage(input: CreateServiceImageInput): Promise<ServiceImageRecord> {
    return db.serviceImage.create({ data: input });
  }

  createDailyWashImage(input: CreateDailyWashImageInput): Promise<DailyWashImageRecord> {
    return db.dailyWashPhoto.create({ data: input });
  }

  findDailyWashImages(dailyWashId: string): Promise<DailyWashImageRecord[]> {
    return db.dailyWashPhoto.findMany({
      where: { dailyWashId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const imagePersistentStorageRepository = new ImagePersistentStorageRepository();
