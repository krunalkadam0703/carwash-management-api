import type { AuditLogRecord, CreateAuditLogInput } from '../../models/audit-log.model.js';
import { auditLogPersistentStorageRepository } from './persistent-storage.js';

export class AuditLogRepository {
  findManyByBusinessId(businessId?: string): Promise<AuditLogRecord[]> {
    return auditLogPersistentStorageRepository.findManyByBusinessId(businessId);
  }

  create(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    return auditLogPersistentStorageRepository.create(input);
  }
}

export const auditLogRepository = new AuditLogRepository();
