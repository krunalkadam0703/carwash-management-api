import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { SubscriptionPauseRecord } from '../models/subscription-pause.model.js';
import { subscriptionPauseRepository } from '../repositories/subscription-pause/index.js';
import { AppError } from '../utils/app-error.js';

export class SubscriptionPauseService {
  async list(user: AppUser): Promise<SubscriptionPauseRecord[]> {
    const businessId = this.requireBusinessId(user);
    return subscriptionPauseRepository.findManyByBusinessId(businessId, user.role === 'CUSTOMER' ? user.id : undefined);
  }

  async create(user: AppUser, input: { subscriptionId: string; startDate: Date; endDate: Date; reason?: string }): Promise<SubscriptionPauseRecord> {
    if (user.role !== 'CUSTOMER') throw new AppError('Only customers can pause subscriptions.', HttpStatus.FORBIDDEN);
    const businessId = this.requireBusinessId(user);
    const subscription = await subscriptionPauseRepository.findSubscription(businessId, input.subscriptionId);
    if (!subscription || subscription.customerId !== user.id) throw new AppError('Subscription was not found.', HttpStatus.NOT_FOUND);
    if (subscription.status !== 'ACTIVE') throw new AppError('Only active subscriptions can be paused.', HttpStatus.CONFLICT);
    if (input.endDate < input.startDate) throw new AppError('endDate must be after startDate.', HttpStatus.BAD_REQUEST);

    return subscriptionPauseRepository.create({
      businessId,
      customerId: user.id,
      subscriptionId: input.subscriptionId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
    });
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  date(value: unknown, field: string): Date {
    if (typeof value !== 'string' || !value.trim()) throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new AppError(field + ' must be valid.', HttpStatus.BAD_REQUEST);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const subscriptionPauseService = new SubscriptionPauseService();
