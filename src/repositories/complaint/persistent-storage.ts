import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { ComplaintRecord, CreateComplaintInput, UpdateComplaintInput } from '../../models/complaint.model.js';

type ComplaintDelegate = {
  findMany(args: unknown): Promise<ComplaintRecord[]>;
  findFirst(args: unknown): Promise<ComplaintRecord | null>;
  create(args: unknown): Promise<ComplaintRecord>;
  update(args: unknown): Promise<ComplaintRecord>;
};
type AppDb = { complaint: ComplaintDelegate };

const db = prisma as unknown as AppDb;

export class ComplaintPersistentStorageRepository {
  findManyByBusinessId(businessId: string, customerId?: string): Promise<ComplaintRecord[]> {
    return db.complaint.findMany({
      where: { businessId, ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(businessId: string, id: string): Promise<ComplaintRecord | null> {
    return db.complaint.findFirst({ where: { id, businessId } });
  }

  create(input: CreateComplaintInput): Promise<ComplaintRecord> {
    return db.complaint.create({ data: input });
  }

  updateStatus(input: UpdateComplaintInput): Promise<ComplaintRecord> {
    return db.complaint.update({
      where: { id: input.id },
      data: { status: input.status, resolvedAt: input.status === 'RESOLVED' ? new Date() : undefined },
    });
  }
}

export const complaintPersistentStorageRepository = new ComplaintPersistentStorageRepository();
