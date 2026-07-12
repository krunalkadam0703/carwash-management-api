import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleRecord,
} from '../../models/vehicle.model.js';
import type { PaginationInput, PaginatedResult } from '../../utils/pagination.js';
import { paginated, skip } from '../../utils/pagination.js';

type VehicleDelegate = {
  findMany(args: unknown): Promise<VehicleRecord[]>;
  findFirst(args: unknown): Promise<VehicleRecord | null>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<VehicleRecord>;
  update(args: unknown): Promise<VehicleRecord>;
};
type AssignmentDelegate = { findMany(args: unknown): Promise<{ vehicleId: string }[]> };
type UserDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type VehicleTypeDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type AppDb = {
  vehicle: VehicleDelegate;
  user: UserDelegate;
  vehicleType: VehicleTypeDelegate;
  workerAssignment: AssignmentDelegate;
};

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

  async findPageByBusinessId(
    businessId: string,
    input: PaginationInput,
    customerId?: string,
  ): Promise<PaginatedResult<VehicleRecord>> {
    const assignmentVehicleIds = input.assignment && input.assignment !== 'all'
      ? (await db.workerAssignment.findMany({
        where: { status: { not: 'COMPLETED' }, vehicle: { businessId } },
        select: { vehicleId: true },
      })).map(row => row.vehicleId)
      : undefined;
    const where = {
      businessId,
      ...(customerId ? { customerId } : {}),
      ...(input.assignment === 'assigned' ? { id: { in: assignmentVehicleIds ?? [] } } : {}),
      ...(input.assignment === 'unassigned' ? { id: { notIn: assignmentVehicleIds ?? [] } } : {}),
      ...(input.search ? {
        OR: [
          { vehicleNumber: { contains: input.search, mode: 'insensitive' } },
          { vehicleName: { contains: input.search, mode: 'insensitive' } },
          { location: { contains: input.search, mode: 'insensitive' } },
          { availableTimeSlot: { contains: input.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const [total, rows] = await Promise.all([
      db.vehicle.count({ where }),
      db.vehicle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: skip(input),
        take: input.pageSize,
      }),
    ]);
    return paginated(rows, total, input);
  }

  findByVehicleNumber(
    businessId: string,
    vehicleNumber: string,
  ): Promise<VehicleRecord | null> {
    return db.vehicle.findFirst({ where: { businessId, vehicleNumber } });
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
