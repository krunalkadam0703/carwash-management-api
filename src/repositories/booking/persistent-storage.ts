import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { BookingRecord, CreateBookingInput, UpdateBookingStatusInput } from '../../models/booking.model.js';

type PrismaBooking = Omit<BookingRecord, 'amount'> & { amount?: { toString(): string } | null };
type VehicleLite = { customerId: string };
type ServiceLite = { basePrice: { toString(): string } };
type BookingDelegate = {
  findMany(args: unknown): Promise<PrismaBooking[]>;
  findFirst(args: unknown): Promise<PrismaBooking | null>;
  create(args: unknown): Promise<PrismaBooking>;
  update(args: unknown): Promise<PrismaBooking>;
};
type VehicleDelegate = { findFirst(args: unknown): Promise<VehicleLite | null> };
type ServiceDelegate = { findFirst(args: unknown): Promise<ServiceLite | null> };
type AppDb = { booking: BookingDelegate; vehicle: VehicleDelegate; service: ServiceDelegate };

const db = prisma as unknown as AppDb;
const mapBooking = (row: PrismaBooking): BookingRecord => ({ ...row, amount: row.amount?.toString() ?? null });

export class BookingPersistentStorageRepository {
  async findManyByBusinessId(businessId: string, customerId?: string): Promise<BookingRecord[]> {
    const rows = await db.booking.findMany({
      where: { businessId, ...(customerId ? { customerId } : {}) },
      orderBy: { scheduledDate: 'desc' },
      take: 200,
    });
    return rows.map(mapBooking);
  }

  async findById(businessId: string, id: string): Promise<BookingRecord | null> {
    const row = await db.booking.findFirst({ where: { id, businessId } });
    return row ? mapBooking(row) : null;
  }

  findVehicle(businessId: string, id: string): Promise<VehicleLite | null> {
    return db.vehicle.findFirst({ where: { id, businessId } });
  }

  findService(businessId: string, id: string): Promise<ServiceLite | null> {
    return db.service.findFirst({ where: { id, businessId, isActive: true } });
  }

  async create(input: CreateBookingInput): Promise<BookingRecord> {
    const row = await db.booking.create({
      data: {
        ...input,
        receiptNumber: `BK-${Date.now()}`,
        status: 'PENDING',
      },
    });
    return mapBooking(row);
  }

  async updateStatus(input: UpdateBookingStatusInput): Promise<BookingRecord> {
    const row = await db.booking.update({
      where: { id: input.id },
      data: {
        status: input.status,
        workerId: input.workerId,
        startedAt: input.status === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: input.status === 'COMPLETED' || input.status === 'SKIPPED' ? new Date() : undefined,
        cancelledAt: input.status === 'CANCELLED' ? new Date() : undefined,
        skipReason: input.skipReason,
      },
    });
    return mapBooking(row);
  }

  async rate(id: string, rating: number, ratingComment?: string): Promise<BookingRecord> {
    const row = await db.booking.update({ where: { id }, data: { rating, ratingComment } });
    return mapBooking(row);
  }
}

export const bookingPersistentStorageRepository = new BookingPersistentStorageRepository();
