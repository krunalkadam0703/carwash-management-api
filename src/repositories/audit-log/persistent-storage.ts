import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { AuditLogRecord, CreateAuditLogInput } from '../../models/audit-log.model.js';

type AuditLogDelegate = {
  findMany(args: unknown): Promise<AuditLogRecord[]>;
  create(args: unknown): Promise<AuditLogRecord>;
};
type AppDb = { auditLog: AuditLogDelegate };

const db = prisma as unknown as AppDb;

export class AuditLogPersistentStorageRepository {
  findManyByBusinessId(businessId?: string): Promise<AuditLogRecord[]> {
    return db.auditLog.findMany({
      where: businessId ? { businessId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  create(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    return db.auditLog.create({ data: input });
  }
}

export const auditLogPersistentStorageRepository = new AuditLogPersistentStorageRepository();
