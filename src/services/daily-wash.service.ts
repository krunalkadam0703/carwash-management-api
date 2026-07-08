import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { DailyWashRecord } from '../models/daily-wash.model.js';
import { redisService } from '../infrastructure/redis/index.js';
import { dailyWashRepository } from '../repositories/daily-wash/index.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/app-error.js';

const slotKey = (businessId: string, dailyWashId: string): string =>
  `daily-wash-slot:${businessId}:${dailyWashId}`;

export class DailyWashService {
  async list(user: AppUser, date?: Date, endDate?: Date): Promise<DailyWashRecord[]> {
    const businessId = this.requireBusinessId(user);
    const rows = await dailyWashRepository.findManyByBusinessId(
      businessId,
      date,
      endDate,
      user.role === 'CUSTOMER' ? user.id : undefined,
    );
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        slotOverride: await redisService.get(slotKey(row.businessId, row.id)),
      })),
    );
  }

  async generate(user: AppUser, date: Date): Promise<DailyWashRecord[]> {
    this.requireOwner(user);
    return dailyWashRepository.generateForDate(this.requireBusinessId(user), date);
  }

  async start(user: AppUser, id: string): Promise<DailyWashRecord> {
    this.requireWorkerOrOwner(user);
    const row = await this.requireDailyWash(user, id);
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
    const dailyWash = await dailyWashRepository.updateStatus({
      id,
      businessId: this.requireBusinessId(user),
      status: 'COMPLETED',
    });
    await redisService.delete(slotKey(row.businessId, id));
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

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
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
    this.ensureCanAccess(user, row);
    return row;
  }

  private ensureCanAccess(user: AppUser, row: DailyWashRecord): void {
    if (user.role === 'CUSTOMER' && row.customerId !== user.id)
      throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
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
