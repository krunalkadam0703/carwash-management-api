import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { ComplaintRecord, ComplaintStatus } from '../models/complaint.model.js';
import { complaintRepository } from '../repositories/complaint/index.js';
import { auditLogService } from './audit-log.service.js';
import { AppError } from '../utils/app-error.js';

const STATUSES: ComplaintStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];

export class ComplaintService {
  async list(user: AppUser): Promise<ComplaintRecord[]> {
    const businessId = this.requireBusinessId(user);
    return complaintRepository.findManyByBusinessId(businessId, user.role === 'CUSTOMER' ? user.id : undefined);
  }

  async create(user: AppUser, input: { subject: string; message: string }): Promise<ComplaintRecord> {
    if (user.role !== 'CUSTOMER') throw new AppError('Only customers can create complaints.', HttpStatus.FORBIDDEN);
    const businessId = this.requireBusinessId(user);
    return complaintRepository.create({ ...input, businessId, customerId: user.id });
  }

  async updateStatus(user: AppUser, id: string, status: ComplaintStatus): Promise<ComplaintRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    const existing = await complaintRepository.findById(businessId, id);
    if (!existing) throw new AppError('Complaint was not found.', HttpStatus.NOT_FOUND);
    const complaint = await complaintRepository.updateStatus({ id, businessId, status });
    await auditLogService.create({
      businessId,
      userId: user.id,
      action: 'UPDATE_COMPLAINT_STATUS',
      entityType: 'Complaint',
      entityId: complaint.id,
      oldData: { status: existing.status },
      newData: { status: complaint.status },
    });
    return complaint;
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  status(value: unknown): ComplaintStatus {
    if (typeof value !== 'string' || !STATUSES.includes(value as ComplaintStatus)) throw new AppError('status is invalid.', HttpStatus.BAD_REQUEST);
    return value as ComplaintStatus;
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER') throw new AppError('Only owners can update complaints.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const complaintService = new ComplaintService();
