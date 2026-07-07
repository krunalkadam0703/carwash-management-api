import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { AuditLogRecord, CreateAuditLogInput } from '../models/audit-log.model.js';
import { auditLogRepository } from '../repositories/audit-log/index.js';
import { AppError } from '../utils/app-error.js';

export class AuditLogService {
  list(user: AppUser): Promise<AuditLogRecord[]> {
    if (user.role === 'SYSTEM_ADMIN') return auditLogRepository.findManyByBusinessId();
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can view audit logs.', HttpStatus.FORBIDDEN);
    return auditLogRepository.findManyByBusinessId(this.requireBusinessId(user));
  }

  create(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    return auditLogRepository.create(input);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const auditLogService = new AuditLogService();
