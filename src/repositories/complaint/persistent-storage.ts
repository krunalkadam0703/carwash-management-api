import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  ComplaintRecord,
  CreateComplaintInput,
  UpdateComplaintInput,
} from '../../models/complaint.model.js';
import type { PaginationInput, PaginatedResult } from '../../utils/pagination.js';
import { paginated, skip } from '../../utils/pagination.js';

type ComplaintDelegate = {
  findMany(args: unknown): Promise<ComplaintRecord[]>;
  findFirst(args: unknown): Promise<ComplaintRecord | null>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<ComplaintRecord>;
  update(args: unknown): Promise<ComplaintRecord>;
};
type DailyWashDelegate = {
  findFirst(args: unknown): Promise<{
    id: string;
    businessId: string;
    customerId: string;
    vehicleId: string;
    washDate: Date;
  } | null>;
};
type BusinessDelegate = { findFirst(args: unknown): Promise<{ ownerId: string } | null> };
type AppDb = {
  complaint: ComplaintDelegate;
  dailyWashSchedule: DailyWashDelegate;
  business: BusinessDelegate;
};

const db = prisma as unknown as AppDb;

export class ComplaintPersistentStorageRepository {
  findManyByBusinessId(businessId: string, participantId?: string): Promise<ComplaintRecord[]> {
    return db.complaint.findMany({
      where: {
        businessId,
        ...(participantId
          ? {
              OR: [
                { customerId: participantId },
                { workerId: participantId },
                { createdById: participantId },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phoneNumber: true } },
        worker: { select: { id: true, name: true, email: true, phoneNumber: true } },
        createdBy: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPageByBusinessId(
    businessId: string,
    input: PaginationInput,
    participantId?: string,
  ): Promise<PaginatedResult<ComplaintRecord>> {
    const where = {
      businessId,
      ...(input.status ? { status: input.status } : {}),
      ...(participantId
        ? {
            OR: [
              { customerId: participantId },
              { workerId: participantId },
              { createdById: participantId },
            ],
          }
        : {}),
      ...(input.search
        ? {
            AND: [
              {
                OR: [
                  { subject: { contains: input.search, mode: 'insensitive' } },
                  { message: { contains: input.search, mode: 'insensitive' } },
                  { conclusion: { contains: input.search, mode: 'insensitive' } },
                  { customer: { name: { contains: input.search, mode: 'insensitive' } } },
                  { worker: { name: { contains: input.search, mode: 'insensitive' } } },
                ],
              },
            ],
          }
        : {}),
    };
    const include = {
      customer: { select: { id: true, name: true, email: true, phoneNumber: true } },
      worker: { select: { id: true, name: true, email: true, phoneNumber: true } },
      createdBy: { select: { id: true, name: true, email: true, phoneNumber: true } },
    };
    const [total, rows] = await Promise.all([
      db.complaint.count({ where }),
      db.complaint.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: skip(input),
        take: input.pageSize,
      }),
    ]);
    return paginated(rows, total, input);
  }

  findById(businessId: string, id: string): Promise<ComplaintRecord | null> {
    return db.complaint.findFirst({ where: { id, businessId } });
  }

  findDailyWash(businessId: string, id: string) {
    return db.dailyWashSchedule.findFirst({
      where: { id, businessId },
      select: { id: true, businessId: true, customerId: true, vehicleId: true, washDate: true },
    });
  }

  async findOwnerId(businessId: string): Promise<string | null> {
    return (
      (await db.business.findFirst({ where: { id: businessId }, select: { ownerId: true } }))
        ?.ownerId ?? null
    );
  }

  create(input: CreateComplaintInput): Promise<ComplaintRecord> {
    return db.complaint.create({ data: input });
  }

  updateStatus(input: UpdateComplaintInput): Promise<ComplaintRecord> {
    return db.complaint.update({
      where: { id: input.id },
      data: {
        status: input.status,
        conclusion: input.conclusion,
        resolvedAt: input.status === 'RESOLVED' ? new Date() : undefined,
      },
    });
  }
}

export const complaintPersistentStorageRepository = new ComplaintPersistentStorageRepository();
