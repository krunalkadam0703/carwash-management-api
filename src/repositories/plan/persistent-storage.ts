import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { CreatePlanInput, PlanRecord, UpdatePlanInput } from '../../models/plan.model.js';
import type { PaginationInput, PaginatedResult } from '../../utils/pagination.js';
import { paginated, skip } from '../../utils/pagination.js';

type PrismaPlanRecord = Omit<PlanRecord, 'price' | 'serviceIds'> & {
  price: { toString(): string };
  services?: { serviceId: string }[];
};
type PlanDelegate = {
  findMany(args: unknown): Promise<PrismaPlanRecord[]>;
  findFirst(args: unknown): Promise<PrismaPlanRecord | null>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<PrismaPlanRecord>;
  update(args: unknown): Promise<PrismaPlanRecord>;
};
type ServiceDelegate = { count(args: unknown): Promise<number> };
type VehicleTypeDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type PlanServiceDelegate = {
  deleteMany(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
};
type AppDb = {
  plan: PlanDelegate;
  service: ServiceDelegate;
  vehicleType: VehicleTypeDelegate;
  planService: PlanServiceDelegate;
  $transaction<T>(fn: (tx: AppDb) => Promise<T>): Promise<T>;
};

const db = prisma as unknown as AppDb;
const mapPlan = (plan: PrismaPlanRecord): PlanRecord => ({
  ...plan,
  price: plan.price.toString(),
  serviceIds: plan.services?.map((service) => service.serviceId),
});

export class PlanPersistentStorageRepository {
  async findManyByBusinessId(businessId: string, activeOnly = false): Promise<PlanRecord[]> {
    const plans = await db.plan.findMany({
      where: { businessId, ...(activeOnly ? { isActive: true } : {}) },
      include: { services: { select: { serviceId: true } } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
    return plans.map(mapPlan);
  }

  async findById(businessId: string, id: string): Promise<PlanRecord | null> {
    const plan = await db.plan.findFirst({
      where: { id, businessId },
      include: { services: { select: { serviceId: true } } },
    });
    return plan ? mapPlan(plan) : null;
  }

  async existsVehicleTypeForBusiness(businessId: string, vehicleTypeId: string): Promise<boolean> {
    return Boolean(
      await db.vehicleType.findFirst({
        where: { id: vehicleTypeId, businessId },
        select: { id: true },
      }),
    );
  }

  async countServicesForBusiness(businessId: string, serviceIds: string[]): Promise<number> {
    return db.service.count({ where: { businessId, id: { in: serviceIds } } });
  }

  async create(input: CreatePlanInput): Promise<PlanRecord> {
    const { serviceIds, ...data } = input;
    return db.$transaction(async (tx) => {
      const plan = await tx.plan.create({ data });
      if (serviceIds?.length)
        await tx.planService.createMany({
          data: serviceIds.map((serviceId) => ({ planId: plan.id, serviceId })),
        });
      const savedPlan = await tx.plan.findFirst({
        where: { id: plan.id },
        include: { services: { select: { serviceId: true } } },
      });
      return mapPlan(savedPlan ?? plan);
    });
  }

  async findPageByBusinessId(
    businessId: string,
    input: PaginationInput,
  ): Promise<PaginatedResult<PlanRecord>> {
    const activeOnly = input.activeOnly === 'true';
    const where = {
      businessId,
      ...(activeOnly || input.status === 'active' ? { isActive: true } : {}),
      ...(input.status === 'inactive' ? { isActive: false } : {}),
      ...(input.vehicleTypeId ? { vehicleTypeId: input.vehicleTypeId } : {}),
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: 'insensitive' } },
              { description: { contains: input.search, mode: 'insensitive' } },
              { category: { contains: input.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, plans] = await Promise.all([
      db.plan.count({ where }),
      db.plan.findMany({
        where,
        include: { services: { select: { serviceId: true } } },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: skip(input),
        take: input.pageSize,
      }),
    ]);
    return paginated(plans.map(mapPlan), total, input);
  }

  async update(input: UpdatePlanInput): Promise<PlanRecord> {
    const { id, businessId: _businessId, serviceIds, ...data } = input;
    return db.$transaction(async (tx) => {
      const plan = await tx.plan.update({ where: { id }, data });
      if (serviceIds) {
        await tx.planService.deleteMany({ where: { planId: id } });
        if (serviceIds.length)
          await tx.planService.createMany({
            data: serviceIds.map((serviceId) => ({ planId: id, serviceId })),
          });
      }
      const savedPlan = await tx.plan.findFirst({
        where: { id: plan.id },
        include: { services: { select: { serviceId: true } } },
      });
      return mapPlan(savedPlan ?? plan);
    });
  }
}

export const planPersistentStorageRepository = new PlanPersistentStorageRepository();
