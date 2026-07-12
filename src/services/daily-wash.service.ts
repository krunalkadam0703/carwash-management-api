import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { DailyWashRecord } from '../models/daily-wash.model.js';
import { redisService } from '../infrastructure/redis/index.js';
import { dailyWashRepository } from '../repositories/daily-wash/index.js';
import { workerRepository } from '../repositories/worker/index.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/app-error.js';
import type { PaginationInput, PaginatedResult } from '../utils/pagination.js';

const slotKey = (businessId: string, dailyWashId: string): string =>
  `daily-wash-slot:${businessId}:${dailyWashId}`;
const workerKey = (businessId: string, dailyWashId: string): string =>
  `daily-wash-worker:${businessId}:${dailyWashId}`;
const queueKey = (businessId: string, dailyWashId: string): string =>
  `daily-wash-queue:${businessId}:${dailyWashId}`;

export class DailyWashService {
  async list(user: AppUser, date?: Date, endDate?: Date): Promise<DailyWashRecord[]> {
    const businessId = this.requireBusinessId(user);
    await this.ensureSchedules(businessId, date, endDate);
    const rows = await dailyWashRepository.findManyByBusinessId(
      businessId,
      date,
      endDate,
      user.role === 'CUSTOMER' ? user.id : undefined,
    );
    const permanentWorkerByVehicle = await this.activeWorkerByVehicle(businessId);
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const temporaryWorkerId = await redisService.get(workerKey(row.businessId, row.id));
        return {
          ...row,
          slotOverride: await redisService.get(slotKey(row.businessId, row.id)),
          queueOrder: Number(await redisService.get(queueKey(row.businessId, row.id))) || null,
          temporaryWorkerId,
          assignedWorkerId: temporaryWorkerId ?? permanentWorkerByVehicle.get(row.vehicleId) ?? null,
        };
      }),
    );
    return user.role === 'WORKER'
      ? enriched.filter((row) => row.assignedWorkerId === user.id)
      : enriched;
  }

  async listPage(
    user: AppUser,
    input: PaginationInput,
    date?: Date,
    endDate?: Date,
  ): Promise<PaginatedResult<DailyWashRecord>> {
    const businessId = this.requireBusinessId(user);
    await this.ensureSchedules(businessId, date, endDate);
    const result = await dailyWashRepository.findPageByBusinessId(
      businessId,
      input,
      date,
      endDate,
      user.role === 'CUSTOMER' ? user.id : undefined,
    );
    const permanentWorkerByVehicle = await this.activeWorkerByVehicle(businessId);
    const items = await Promise.all(result.items.map(async (row) => {
      const temporaryWorkerId = await redisService.get(workerKey(row.businessId, row.id));
      return {
        ...row,
        slotOverride: await redisService.get(slotKey(row.businessId, row.id)),
        queueOrder: Number(await redisService.get(queueKey(row.businessId, row.id))) || null,
        temporaryWorkerId,
        assignedWorkerId: temporaryWorkerId ?? permanentWorkerByVehicle.get(row.vehicleId) ?? null,
      };
    }));
    return {
      ...result,
      items: user.role === 'WORKER' ? items.filter((row) => row.assignedWorkerId === user.id) : items,
    };
  }

  async generate(user: AppUser, date: Date): Promise<DailyWashRecord[]> {
    this.requireOwner(user);
    return dailyWashRepository.generateForDate(this.requireBusinessId(user), date);
  }

  async start(user: AppUser, id: string): Promise<DailyWashRecord> {
    this.requireWorkerOrOwner(user);
    const row = await this.requireDailyWash(user, id);
    if (row.status === 'COMPLETED')
      throw new AppError('Completed washes cannot be started again.', HttpStatus.CONFLICT);
    const dailyWash = await dailyWashRepository.updateStatus({
      id,
      businessId: this.requireBusinessId(user),
      status: 'IN_PROGRESS',
    });
    await notificationService.create({
      userId: row.customerId,
      type: 'CAR_WASH_STARTED',
      title: 'Car wash started',
      message: 'Your scheduled car wash has started.',
      actionUrl: `/customer/calendar`,
      metadata: { dailyWashId: dailyWash.id },
    });
    return dailyWash;
  }

  async complete(user: AppUser, id: string): Promise<DailyWashRecord> {
    this.requireWorkerOrOwner(user);
    const row = await this.requireDailyWash(user, id);
    if (row.status === 'COMPLETED')
      throw new AppError('This vehicle is already washed for today.', HttpStatus.CONFLICT);
    const dailyWash = await dailyWashRepository.updateStatus({
      id,
      businessId: this.requireBusinessId(user),
      status: 'COMPLETED',
    });
    await redisService.delete(slotKey(row.businessId, id));
    await redisService.delete(workerKey(row.businessId, id));
    await notificationService.create({
      userId: row.customerId,
      type: 'CAR_WASH_COMPLETED',
      title: 'Car wash completed',
      message: 'Your scheduled car wash has been completed.',
      actionUrl: `/customer/calendar`,
      metadata: { dailyWashId: dailyWash.id },
    });
    return dailyWash;
  }

  async unavailable(user: AppUser, id: string, reason?: string): Promise<DailyWashRecord> {
    const row = await this.requireDailyWash(user, id);
    if (user.role === 'CUSTOMER' && row.customerId !== user.id)
      throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    const dailyWash = await dailyWashRepository.updateStatus({
      id,
      businessId: row.businessId,
      status: 'UNAVAILABLE',
      unavailableReason: reason,
    });
    await redisService.delete(slotKey(row.businessId, id));
    return dailyWash;
  }

  async updateSlot(user: AppUser, id: string, slot: string): Promise<DailyWashRecord> {
    if (user.role !== 'CUSTOMER')
      throw new AppError('Only customers can change wash slots.', HttpStatus.FORBIDDEN);
    const row = await this.requireDailyWash(user, id);
    if (row.customerId !== user.id) throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    if (row.status !== 'SCHEDULED')
      throw new AppError('Only scheduled washes can be changed.', HttpStatus.CONFLICT);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(row.washDate) <= today)
      throw new AppError('Only future wash slots can be changed.', HttpStatus.CONFLICT);
    await redisService.set(slotKey(row.businessId, id), slot, 60 * 60 * 24 * 45);
    return { ...row, slotOverride: slot };
  }

  async assignTemporaryWorker(
    user: AppUser,
    id: string,
    workerId: string,
  ): Promise<DailyWashRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    if (!(await workerRepository.existsWorkerForBusiness(businessId, workerId)))
      throw new AppError('Worker was not found.', HttpStatus.NOT_FOUND);
    const row = await this.requireDailyWash(user, id);
    if (row.status === 'COMPLETED')
      throw new AppError('Completed washes cannot be reassigned.', HttpStatus.CONFLICT);
    await redisService.set(workerKey(row.businessId, id), workerId, 60 * 60 * 36);
    await notificationService.create({
      userId: workerId,
      type: 'VEHICLE_ASSIGNED',
      title: 'Daily job assigned',
      message: 'A daily wash has been assigned to you.',
      actionUrl: '/worker/jobs',
      metadata: { dailyWashId: id },
    });
    return { ...row, temporaryWorkerId: workerId, assignedWorkerId: workerId };
  }

  async updateQueueOrder(user: AppUser, id: string, queueOrder: number): Promise<DailyWashRecord> {
    this.requireOwner(user);
    if (!Number.isInteger(queueOrder) || queueOrder < 0)
      throw new AppError('queueOrder must be a positive integer.', HttpStatus.BAD_REQUEST);
    const row = await this.requireDailyWash(user, id);
    if (row.status === 'COMPLETED')
      throw new AppError('Completed washes cannot be reordered.', HttpStatus.CONFLICT);
    await redisService.set(queueKey(row.businessId, id), String(queueOrder), 60 * 60 * 24 * 45);
    const workerId = await this.assignedWorkerId(row);
    if (workerId) await notificationService.create({
      userId: workerId,
      type: 'SYSTEM',
      title: 'Work order changed',
      message: 'Your daily work queue order was changed.',
      actionUrl: '/worker/jobs',
      metadata: { dailyWashId: id, queueOrder },
    });
    return { ...row, queueOrder };
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  number(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new AppError(field + ' is invalid.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  date(value: unknown): Date {
    const raw = typeof value === 'string' && value.trim() ? value : new Date().toISOString();
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime()))
      throw new AppError('date must be valid.', HttpStatus.BAD_REQUEST);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  private async requireDailyWash(user: AppUser, id: string): Promise<DailyWashRecord> {
    const row = await dailyWashRepository.findById(this.requireBusinessId(user), id);
    if (!row) throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    await this.ensureCanAccess(user, row);
    return row;
  }

  private async ensureCanAccess(user: AppUser, row: DailyWashRecord): Promise<void> {
    if (user.role === 'CUSTOMER' && row.customerId !== user.id)
      throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    if (user.role !== 'WORKER') return;
    if ((await this.assignedWorkerId(row)) !== user.id)
      throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
  }

  private async assignedWorkerId(row: DailyWashRecord): Promise<string | null> {
    return (
      (await redisService.get(workerKey(row.businessId, row.id))) ??
      (await this.activeWorkerByVehicle(row.businessId)).get(row.vehicleId) ??
      null
    );
  }

  private async activeWorkerByVehicle(businessId: string): Promise<Map<string, string>> {
    const assignments = await workerRepository.findAssignmentsByBusinessId(businessId);
    const active = assignments.filter((item) => item.status !== 'COMPLETED');
    return new Map(active.map((item) => [item.vehicleId, item.workerId]));
  }

  private async ensureSchedules(businessId: string, date?: Date, endDate?: Date): Promise<void> {
    if (!date) return;
    const dates = endDate ? this.dateRange(date, endDate) : [date];
    await Promise.all(dates.map((item) => dailyWashRepository.generateForDate(businessId, item)));
  }

  private dateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    for (let item = new Date(start); item <= end; item.setDate(item.getDate() + 1)) {
      dates.push(new Date(item));
    }
    return dates;
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can generate daily wash schedules.', HttpStatus.FORBIDDEN);
  }

  private requireWorkerOrOwner(user: AppUser): void {
    if (!['OWNER', 'WORKER'].includes(user.role))
      throw new AppError(
        'Only workers or owners can update daily wash progress.',
        HttpStatus.FORBIDDEN,
      );
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const dailyWashService = new DailyWashService();
