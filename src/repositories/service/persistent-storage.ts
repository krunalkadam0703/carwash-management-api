import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateServiceInput,
  ServiceRecord,
  UpdateServiceInput,
} from '../../models/service.model.js';

type PrismaServiceRecord = Omit<ServiceRecord, 'basePrice'> & {
  basePrice: { toString(): string };
};

type ServiceDelegate = {
  findMany(args: unknown): Promise<PrismaServiceRecord[]>;
  findFirst(args: unknown): Promise<PrismaServiceRecord | null>;
  create(args: unknown): Promise<PrismaServiceRecord>;
  update(args: unknown): Promise<PrismaServiceRecord>;
  delete(args: unknown): Promise<PrismaServiceRecord>;
};

type VehicleTypeDelegate = {
  findFirst(args: unknown): Promise<{ id: string } | null>;
};

type AppDb = {
  service: ServiceDelegate;
  vehicleType: VehicleTypeDelegate;
};

const db = prisma as unknown as AppDb;

const mapService = (service: PrismaServiceRecord): ServiceRecord => ({
  ...service,
  basePrice: service.basePrice.toString(),
});

export class ServicePersistentStorageRepository {
  async findManyByBusinessId(businessId: string): Promise<ServiceRecord[]> {
    const services = await db.service.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    return services.map(mapService);
  }

  async findById(businessId: string, id: string): Promise<ServiceRecord | null> {
    const service = await db.service.findFirst({
      where: { id, businessId },
    });

    return service ? mapService(service) : null;
  }

  async existsVehicleTypeForBusiness(businessId: string, vehicleTypeId: string): Promise<boolean> {
    const vehicleType = await db.vehicleType.findFirst({
      where: { id: vehicleTypeId, businessId },
      select: { id: true },
    });

    return Boolean(vehicleType);
  }

  async create(input: CreateServiceInput): Promise<ServiceRecord> {
    const service = await db.service.create({
      data: input,
    });

    return mapService(service);
  }

  async update(input: UpdateServiceInput): Promise<ServiceRecord> {
    const service = await db.service.update({
      where: { id: input.id },
      data: {
        vehicleTypeId: input.vehicleTypeId,
        name: input.name,
        description: input.description,
        basePrice: input.basePrice,
      },
    });

    return mapService(service);
  }

  async delete(id: string): Promise<ServiceRecord> {
    const service = await db.service.delete({
      where: { id },
    });

    return mapService(service);
  }
}

export const servicePersistentStorageRepository = new ServicePersistentStorageRepository();
