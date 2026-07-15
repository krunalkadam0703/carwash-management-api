import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  ActiveSubscriptionForWash,
  DailyWashRecord,
  UpdateDailyWashInput,
} from '../../models/daily-wash.model.js';
import type { PaginationInput, PaginatedResult } from '../../utils/pagination.js';
import { paginated, skip } from '../../utils/pagination.js';

type DailyWashDelegate = {
  findMany(args: unknown): Promise<DailyWashRecord[]>;
  findFirst(args: unknown): Promise<DailyWashRecord | null>;
  count(args: unknown): Promise<number>;
  createMany(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<DailyWashRecord>;
};
type SubscriptionDelegate = { findMany(args: unknown): Promise<ActiveSubscriptionForWash[]> };
type AppDb = { dailyWashSchedule: DailyWashDelegate; vehicleSubscription: SubscriptionDelegate };

const db = prisma as unknown as AppDb;

export class DailyWashPersistentStorageRepository {
  findManyByBusinessId(
    businessId: string,
    date?: Date,
    endDate?: Date,
    customerId?: string,
  ): Promise<DailyWashRecord[]> {
    return db.dailyWashSchedule.findMany({
      where: {
        businessId,
        ...(date && endDate ? { washDate: { gte: date, lte: endDate } } : {}),
        ...(date && !endDate ? { washDate: date } : {}),
        ...(customerId ? { customerId } : {}),
      },
      include: {
        vehicle: {
          select: {
            vehicleNumber: true,
            vehicleName: true,
            brand: true,
            model: true,
            location: true,
            availableTimeSlot: true,
            customer: { select: { name: true, phoneNumber: true, address: true } },
          },
        },
      },
      orderBy: [{ washDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findPageByBusinessId(
    businessId: string,
    input: PaginationInput,
    date?: Date,
    endDate?: Date,
    customerId?: string,
  ): Promise<PaginatedResult<DailyWashRecord>> {
    const where = {
      businessId,
      ...(date && endDate ? { washDate: { gte: date, lte: endDate } } : {}),
      ...(date && !endDate ? { washDate: date } : {}),
      ...(customerId ? { customerId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.search
        ? {
            OR: [
              { vehicle: { vehicleNumber: { contains: input.search, mode: 'insensitive' } } },
              { vehicle: { vehicleName: { contains: input.search, mode: 'insensitive' } } },
              { vehicle: { location: { contains: input.search, mode: 'insensitive' } } },
              { vehicle: { customer: { name: { contains: input.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const include = {
      vehicle: {
        select: {
          vehicleNumber: true,
          vehicleName: true,
          brand: true,
          model: true,
          location: true,
          availableTimeSlot: true,
          customer: { select: { name: true, phoneNumber: true, address: true } },
        },
      },
    };
    const [total, rows] = await Promise.all([
      db.dailyWashSchedule.count({ where }),
      db.dailyWashSchedule.findMany({
        where,
        include,
        orderBy: [{ washDate: 'asc' }, { createdAt: 'asc' }],
        skip: skip(input),
        take: input.pageSize,
      }),
    ]);
    return paginated(rows, total, input);
  }

  findById(businessId: string, id: string): Promise<DailyWashRecord | null> {
    return db.dailyWashSchedule.findFirst({ where: { id, businessId } });
  }

  findActiveSubscriptionsForDate(
    businessId: string,
    date: Date,
  ): Promise<ActiveSubscriptionForWash[]> {
    return db.vehicleSubscription.findMany({
      where: { businessId, status: 'ACTIVE', startDate: { lte: date }, endDate: { gte: date } },
      select: { id: true, businessId: true, customerId: true, vehicleId: true },
    });
  }

  async generateForDate(businessId: string, date: Date): Promise<void> {
    if (date.getDay() === 1) return;
    const subscriptions = await this.findActiveSubscriptionsForDate(businessId, date);
    if (!subscriptions.length) return;

    await db.dailyWashSchedule.createMany({
      data: subscriptions.map((subscription) => ({
        businessId,
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        vehicleId: subscription.vehicleId,
        washDate: date,
      })),
      skipDuplicates: true,
    });
  }

  updateStatus(input: UpdateDailyWashInput): Promise<DailyWashRecord> {
    return db.dailyWashSchedule.update({
      where: { id: input.id },
      data: { status: input.status, unavailableReason: input.unavailableReason },
    });
  }
}

export const dailyWashPersistentStorageRepository = new DailyWashPersistentStorageRepository();
