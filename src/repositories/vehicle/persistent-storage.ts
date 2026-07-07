import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleRecord,
} from '../../models/vehicle.model.js';

type VehicleDelegate = {
  findMany(args: unknown): Promise<VehicleRecord[]>;
  findFirst(args: unknown): Promise<VehicleRecord | null>;
  create(args: unknown): Promise<VehicleRecord>;
  update(args: unknown): Promise<VehicleRecord>;
};
type UserDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type VehicleTypeDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type AppDb = { vehicle: VehicleDelegate; user: UserDelegate; vehicleType: VehicleTypeDelegate };

const db = prisma as unknown as AppDb;

export class VehiclePersistentStorageRepository {
  findManyByBusinessId(businessId: string, customerId?: string): Promise<VehicleRecord[]> {
    return db.vehicle.findMany({
      where: { businessId, ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(businessId: string, id: string): Promise<VehicleRecord | null> {
    return db.vehicle.findFirst({ where: { id, businessId } });
  }

  async existsCustomerForBusiness(businessId: string, customerId: string): Promise<boolean> {
    return Boolean(
      await db.user.findFirst({
        where: { id: customerId, businessId, role: 'CUSTOMER' },
        select: { id: true },
      }),
    );
  }

  async existsVehicleTypeForBusiness(businessId: string, vehicleTypeId: string): Promise<boolean> {
    return Boolean(
      await db.vehicleType.findFirst({
        where: { id: vehicleTypeId, businessId },
        select: { id: true },
      }),
    );
  }

  create(input: CreateVehicleInput): Promise<VehicleRecord> {
    return db.vehicle.create({ data: input });
  }

  update(input: UpdateVehicleInput): Promise<VehicleRecord> {
    const { id, businessId: _businessId, ...data } = input;
    return db.vehicle.update({ where: { id }, data });
  }
}

export const vehiclePersistentStorageRepository = new VehiclePersistentStorageRepository();
