import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { CreateSubscriptionInput, SubscriptionRecord, UpdateSubscriptionStatusInput } from '../../models/subscription.model.js';

type PrismaSubscription = Omit<SubscriptionRecord, 'amount'> & { amount: { toString(): string } };
type SubscriptionDelegate = {
  findMany(args: unknown): Promise<PrismaSubscription[]>;
  findFirst(args: unknown): Promise<PrismaSubscription | null>;
  create(args: unknown): Promise<PrismaSubscription>;
  update(args: unknown): Promise<PrismaSubscription>;
};
type VehicleDelegate = { findFirst(args: unknown): Promise<{ id: string; customerId: string } | null> };
type PlanDelegate = { findFirst(args: unknown): Promise<{ id: string; price: { toString(): string } } | null> };
type ApprovalLogDelegate = { create(args: unknown): Promise<unknown> };
type AppDb = { vehicleSubscription: SubscriptionDelegate; vehicle: VehicleDelegate; plan: PlanDelegate; subscriptionApprovalLog: ApprovalLogDelegate };

const db = prisma as unknown as AppDb;
const mapSubscription = (row: PrismaSubscription): SubscriptionRecord => ({ ...row, amount: row.amount.toString() });

export class SubscriptionPersistentStorageRepository {
  async findManyByBusinessId(businessId: string, customerId?: string): Promise<SubscriptionRecord[]> {
    const rows = await db.vehicleSubscription.findMany({
      where: { businessId, ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapSubscription);
  }

  async findById(businessId: string, id: string): Promise<SubscriptionRecord | null> {
    const row = await db.vehicleSubscription.findFirst({ where: { id, businessId } });
    return row ? mapSubscription(row) : null;
  }

  findVehicle(businessId: string, vehicleId: string): Promise<{ id: string; customerId: string } | null> {
    return db.vehicle.findFirst({ where: { id: vehicleId, businessId }, select: { id: true, customerId: true } });
  }

  findPlan(businessId: string, planId: string): Promise<{ id: string; price: { toString(): string } } | null> {
    return db.plan.findFirst({ where: { id: planId, businessId, isActive: true }, select: { id: true, price: true } });
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionRecord> {
    return mapSubscription(await db.vehicleSubscription.create({ data: input }));
  }

  async updateStatus(input: UpdateSubscriptionStatusInput, performedById: string, remarks?: string): Promise<SubscriptionRecord> {
    const row = await db.vehicleSubscription.update({
      where: { id: input.id },
      data: {
        status: input.status,
        approvedAt: input.status === 'APPROVED' ? new Date() : undefined,
        approvedById: input.approvedById,
        rejectedAt: input.rejectedAt,
        rejectionReason: input.rejectionReason,
      },
    });
    await db.subscriptionApprovalLog.create({ data: { subscriptionId: input.id, performedById, action: input.status, remarks } });
    return mapSubscription(row);
  }
}

export const subscriptionPersistentStorageRepository = new SubscriptionPersistentStorageRepository();
