import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  CreateSubscriptionInput,
  SubscriptionRecord,
  UpdateSubscriptionStatusInput,
} from '../../models/subscription.model.js';

type PrismaSubscription = Omit<SubscriptionRecord, 'amount'> & { amount: { toString(): string } };
type SubscriptionForActivation = PrismaSubscription & {
  plan: { durationDays: number };
};
type SubscriptionDelegate = {
  findMany(args: unknown): Promise<PrismaSubscription[]>;
  findFirst(args: unknown): Promise<(PrismaSubscription | SubscriptionForActivation) | null>;
  create(args: unknown): Promise<PrismaSubscription>;
  update(args: unknown): Promise<PrismaSubscription>;
};
type VehicleDelegate = {
  findFirst(args: unknown): Promise<{ id: string; customerId: string } | null>;
};
type PlanDelegate = {
  findFirst(args: unknown): Promise<{ id: string; price: { toString(): string } } | null>;
};
type ApprovalLogDelegate = { create(args: unknown): Promise<unknown> };
type DailyWashDelegate = { createMany(args: unknown): Promise<unknown> };
type AppDb = {
  vehicleSubscription: SubscriptionDelegate;
  vehicle: VehicleDelegate;
  plan: PlanDelegate;
  subscriptionApprovalLog: ApprovalLogDelegate;
  dailyWashSchedule: DailyWashDelegate;
  $transaction<T>(fn: (tx: AppDb) => Promise<T>): Promise<T>;
};

const db = prisma as unknown as AppDb;
const mapSubscription = (row: PrismaSubscription): SubscriptionRecord => ({
  ...row,
  amount: row.amount.toString(),
});
const MONDAY = 1;
const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const scheduleDates = (startDate: Date, durationDays: number): Date[] => {
  const dates: Date[] = [];
  for (let offset = 0; offset < durationDays; offset += 1) {
    const washDate = addDays(startDate, offset);
    if (washDate.getDay() !== MONDAY) dates.push(washDate);
  }
  return dates;
};

export class SubscriptionPersistentStorageRepository {
  async findManyByBusinessId(
    businessId: string,
    customerId?: string,
  ): Promise<SubscriptionRecord[]> {
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

  findVehicle(
    businessId: string,
    vehicleId: string,
  ): Promise<{ id: string; customerId: string } | null> {
    return db.vehicle.findFirst({
      where: { id: vehicleId, businessId },
      select: { id: true, customerId: true },
    });
  }

  findPlan(
    businessId: string,
    planId: string,
  ): Promise<{ id: string; price: { toString(): string } } | null> {
    return db.plan.findFirst({
      where: { id: planId, businessId, isActive: true },
      select: { id: true, price: true },
    });
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionRecord> {
    return mapSubscription(await db.vehicleSubscription.create({ data: input }));
  }

  async updateStatus(
    input: UpdateSubscriptionStatusInput,
    performedById: string,
    remarks?: string,
  ): Promise<SubscriptionRecord> {
    return db.$transaction(async (tx) => {
      const row = await tx.vehicleSubscription.update({
        where: { id: input.id },
        data: {
          status: input.status,
          approvedAt: input.status === 'APPROVED' ? new Date() : undefined,
          approvedById: input.approvedById,
          rejectedAt: input.rejectedAt,
          rejectionReason: input.rejectionReason,
        },
      });
      await tx.subscriptionApprovalLog.create({
        data: { subscriptionId: input.id, performedById, action: input.status, remarks },
      });
      return mapSubscription(row);
    });
  }

  async activate(
    businessId: string,
    id: string,
    performedById: string,
    remarks?: string,
  ): Promise<SubscriptionRecord> {
    return db.$transaction(async (tx) => {
      const current = (await tx.vehicleSubscription.findFirst({
        where: { id, businessId },
        include: { plan: { select: { durationDays: true } } },
      })) as SubscriptionForActivation | null;
      if (!current) throw new Error('Subscription was not found.');
      const startDate = startOfToday();
      const endDate = addDays(startDate, Math.max(1, current.plan.durationDays) - 1);
      const row = await tx.vehicleSubscription.update({
        where: { id },
        data: { status: 'ACTIVE', startDate, endDate },
      });
      await tx.subscriptionApprovalLog.create({
        data: { subscriptionId: id, performedById, action: 'ACTIVE', remarks },
      });
      const dates = scheduleDates(startDate, Math.max(1, current.plan.durationDays));
      if (dates.length)
        await tx.dailyWashSchedule.createMany({
          data: dates.map((washDate) => ({
            businessId,
            subscriptionId: id,
            customerId: current.customerId,
            vehicleId: current.vehicleId,
            washDate,
          })),
          skipDuplicates: true,
        });
      return mapSubscription(row);
    });
  }
}

export const subscriptionPersistentStorageRepository =
  new SubscriptionPersistentStorageRepository();
