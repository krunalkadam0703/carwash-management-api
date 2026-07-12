import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { ComplaintRecord, ComplaintStatus } from '../models/complaint.model.js';
import { complaintRepository } from '../repositories/complaint/index.js';
import { workerRepository } from '../repositories/worker/index.js';
import { redisService } from '../infrastructure/redis/index.js';
import { auditLogService } from './audit-log.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/app-error.js';
import type { PaginationInput, PaginatedResult } from '../utils/pagination.js';

const STATUSES: ComplaintStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];
const workerKey = (businessId: string, dailyWashId: string): string =>
  `daily-wash-worker:${businessId}:${dailyWashId}`;

export class ComplaintService {
  async list(user: AppUser): Promise<ComplaintRecord[]> {
    const businessId = this.requireBusinessId(user);
    return complaintRepository.findManyByBusinessId(
      businessId,
      ['CUSTOMER', 'WORKER'].includes(user.role) ? user.id : undefined,
    );
  }

  async listPage(user: AppUser, input: PaginationInput): Promise<PaginatedResult<ComplaintRecord>> {
    const businessId = this.requireBusinessId(user);
    return complaintRepository.findPageByBusinessId(
      businessId,
      input,
      user.role === 'OWNER' ? undefined : user.id,
    );
  }

  async create(
    user: AppUser,
    input: { subject: string; message: string; dailyWashId: string },
  ): Promise<ComplaintRecord> {
    if (!['CUSTOMER', 'WORKER'].includes(user.role))
      throw new AppError('Only customers or workers can create complaints.', HttpStatus.FORBIDDEN);
    const businessId = this.requireBusinessId(user);
    const wash = await complaintRepository.findDailyWash(businessId, input.dailyWashId);
    if (!wash) throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    this.requireTodayOrYesterday(wash.washDate);
    const workerId = await this.assignedWorkerId(businessId, wash.id, wash.vehicleId);
    if (user.role === 'CUSTOMER' && wash.customerId !== user.id)
      throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    if (user.role === 'WORKER' && workerId !== user.id)
      throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);

    const complaint = await complaintRepository.create({
      businessId,
      customerId: wash.customerId,
      workerId,
      createdById: user.id,
      dailyWashId: wash.id,
      complaintDate: wash.washDate,
      subject: input.subject,
      message: input.message,
    });
    await this.notifyOwner(businessId, complaint, user.role);
    await this.notifyAgainstParty(complaint, user.id);
    return complaint;
  }

  async updateStatus(
    user: AppUser,
    id: string,
    status: ComplaintStatus,
    conclusion?: string,
  ): Promise<ComplaintRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    const existing = await complaintRepository.findById(businessId, id);
    if (!existing) throw new AppError('Complaint was not found.', HttpStatus.NOT_FOUND);
    if (status === 'RESOLVED' && !conclusion)
      throw new AppError('Conclusion is required to resolve a complaint.', HttpStatus.BAD_REQUEST);
    const complaint = await complaintRepository.updateStatus({
      id,
      businessId,
      status,
      conclusion: status === 'RESOLVED' ? conclusion : undefined,
    });
    await auditLogService.create({
      businessId,
      userId: user.id,
      action: 'UPDATE_COMPLAINT_STATUS',
      entityType: 'Complaint',
      entityId: complaint.id,
      oldData: { status: existing.status },
      newData: { status: complaint.status },
    });
    if (status === 'RESOLVED') await this.notifyParticipants(complaint);
    return complaint;
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  status(value: unknown): ComplaintStatus {
    if (typeof value !== 'string' || !STATUSES.includes(value as ComplaintStatus))
      throw new AppError('status is invalid.', HttpStatus.BAD_REQUEST);
    return value as ComplaintStatus;
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can update complaints.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }

  private requireTodayOrYesterday(date: Date): void {
    const allowed = new Set([this.dateKey(new Date()), this.dateKey(this.addDays(new Date(), -1))]);
    if (!allowed.has(this.dateKey(date)))
      throw new AppError('Complaints can only be raised for today or yesterday.', HttpStatus.BAD_REQUEST);
  }

  private async assignedWorkerId(
    businessId: string,
    dailyWashId: string,
    vehicleId: string,
  ): Promise<string | null> {
    return (
      (await redisService.get(workerKey(businessId, dailyWashId))) ??
      (await workerRepository.findAssignmentsByBusinessId(businessId))
        .find((item) => item.vehicleId === vehicleId && item.status !== 'COMPLETED')
        ?.workerId ??
      null
    );
  }

  private async notifyOwner(
    businessId: string,
    complaint: ComplaintRecord,
    role: AppUser['role'],
  ): Promise<void> {
    const ownerId = await complaintRepository.findOwnerId(businessId);
    if (!ownerId) return;
    await notificationService.create({
      userId: ownerId,
      type: 'SYSTEM',
      title: 'New complaint registered',
      message: `${role === 'WORKER' ? 'Worker' : 'Customer'} complaint: ${complaint.subject}`,
      actionUrl: '/',
      metadata: { complaintId: complaint.id, dailyWashId: complaint.dailyWashId },
    });
  }

  private async notifyParticipants(complaint: ComplaintRecord): Promise<void> {
    const ids = [...new Set([complaint.customerId, complaint.workerId, complaint.createdById].filter(Boolean))];
    await Promise.all(ids.map((userId) => notificationService.create({
      userId: userId as string,
      type: 'SYSTEM',
      title: 'Complaint resolved',
      message: complaint.conclusion || 'Your complaint has been resolved.',
      actionUrl: '/complaints',
      metadata: { complaintId: complaint.id, dailyWashId: complaint.dailyWashId },
    })));
  }

  private async notifyAgainstParty(complaint: ComplaintRecord, createdById: string): Promise<void> {
    const againstId = complaint.workerId && complaint.workerId !== createdById
      ? complaint.workerId
      : complaint.customerId !== createdById
        ? complaint.customerId
        : null;
    if (!againstId) return;
    await notificationService.create({
      userId: againstId,
      type: 'SYSTEM',
      title: 'Complaint registered against you',
      message: complaint.subject,
      actionUrl: againstId === complaint.customerId ? '/customer/complaints' : '/worker/complaints',
      metadata: { complaintId: complaint.id, dailyWashId: complaint.dailyWashId },
    });
  }

  private dateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}

export const complaintService = new ComplaintService();
