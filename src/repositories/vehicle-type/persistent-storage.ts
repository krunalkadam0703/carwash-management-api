import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateVehicleTypeInput,
  UpdateVehicleTypeInput,
  VehicleTypeRecord,
} from '../../models/vehicle-type.model.js';

type VehicleTypeDelegate = {
  findMany(args: unknown): Promise<VehicleTypeRecord[]>;
  findFirst(args: unknown): Promise<VehicleTypeRecord | null>;
  create(args: unknown): Promise<VehicleTypeRecord>;
  update(args: unknown): Promise<VehicleTypeRecord>;
};

type AppDb = {
  vehicleType: VehicleTypeDelegate;
};

const db = prisma as unknown as AppDb;

export class VehicleTypePersistentStorageRepository {
  findManyByBusinessId(businessId: string): Promise<VehicleTypeRecord[]> {
    return db.vehicleType.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(businessId: string, id: string): Promise<VehicleTypeRecord | null> {
    return db.vehicleType.findFirst({ where: { id, businessId } });
  }

  findBySlug(businessId: string, slug: string): Promise<VehicleTypeRecord | null> {
    return db.vehicleType.findFirst({ where: { businessId, slug } });
  }

  create(input: CreateVehicleTypeInput): Promise<VehicleTypeRecord> {
    return db.vehicleType.create({ data: input });
  }

  update(input: UpdateVehicleTypeInput): Promise<VehicleTypeRecord> {
    const { id, businessId: _businessId, ...data } = input;
    return db.vehicleType.update({ where: { id }, data });
  }
}

export const vehicleTypePersistentStorageRepository = new VehicleTypePersistentStorageRepository();
