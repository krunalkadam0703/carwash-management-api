import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { SubscriptionRecord } from '../models/subscription.model.js';
import { subscriptionRepository } from '../repositories/subscription/index.js';
import { complaintRepository } from '../repositories/complaint/index.js';
import { auditLogService } from './audit-log.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/app-error.js';
import type { PaginationInput, PaginatedResult } from '../utils/pagination.js';

export class SubscriptionService {
  async list(user: AppUser): Promise<SubscriptionRecord[]> {
    const businessId = this.requireBusinessId(user);
    return subscriptionRepository.findManyByBusinessId(
      businessId,
      user.role === 'CUSTOMER' ? user.id : undefined,
    );
  }

  async getById(user: AppUser, id: string): Promise<SubscriptionRecord> {
    const row = await this.requireSubscription(this.requireBusinessId(user), id);
    this.ensureCanAccess(user, row);
    return row;
  }

  async request(
    user: AppUser,
    input: { vehicleId: string; planId: string; suggestedPlanId?: string; autoRenew?: boolean },
  ): Promise<SubscriptionRecord> {
    if (user.role !== 'CUSTOMER')
      throw new AppError('Only customers can request subscriptions.', HttpStatus.FORBIDDEN);
    const businessId = this.requireBusinessId(user);
    const vehicle = await subscriptionRepository.findVehicle(businessId, input.vehicleId);
    if (!vehicle || vehicle.customerId !== user.id)
      throw new AppError('Vehicle was not found.', HttpStatus.NOT_FOUND);

    const plan = await subscriptionRepository.findPlan(businessId, input.planId);
    if (!plan) throw new AppError('Plan was not found.', HttpStatus.NOT_FOUND);
    if (
      input.suggestedPlanId &&
      !(await subscriptionRepository.findPlan(businessId, input.suggestedPlanId))
    ) {
      throw new AppError('Suggested plan was not found.', HttpStatus.NOT_FOUND);
    }

    const subscription = await subscriptionRepository.create({
      businessId,
      customerId: user.id,
      vehicleId: input.vehicleId,
      planId: input.planId,
      suggestedPlanId: input.suggestedPlanId,
      amount: Number(plan.price.toString()),
      autoRenew: input.autoRenew,
    });
    await this.notifyOwner(businessId, {
      type: 'SUBSCRIPTION_REQUEST',
      title: 'New subscription request',
      message: 'A customer requested a subscription approval.',
      actionUrl: '/subscriptions',
      metadata: { subscriptionId: subscription.id },
    });
    return subscription;
  }

  async listPage(
    user: AppUser,
    input: PaginationInput,
  ): Promise<PaginatedResult<SubscriptionRecord>> {
    const businessId = this.requireBusinessId(user);
    return subscriptionRepository.findPageByBusinessId(
      businessId,
      input,
      user.role === 'CUSTOMER' ? user.id : undefined,
    );
  }

  async approve(user: AppUser, id: string, remarks?: string): Promise<SubscriptionRecord> {
    this.requireOwner(user);
    const row = await this.requireRequested(this.requireBusinessId(user), id);
    const subscription = await subscriptionRepository.updateStatus(
      { id, businessId: row.businessId, status: 'APPROVED', approvedById: user.id },
      user.id,
      remarks,
    );
    await auditLogService.create({
      businessId: row.businessId,
      userId: user.id,
      action: 'APPROVE_SUBSCRIPTION',
      entityType: 'VehicleSubscription',
      entityId: subscription.id,
      oldData: { status: row.status },
      newData: { status: subscription.status },
    });
    await notificationService.create({
      userId: subscription.customerId,
      type: 'SUBSCRIPTION_APPROVED',
      title: 'Subscription approved',
      message: 'Your subscription request was approved. Please complete payment to activate it.',
      actionUrl: `/customer/plans`,
      metadata: { subscriptionId: subscription.id },
    });
    return subscription;
  }

  async reject(user: AppUser, id: string, reason: string): Promise<SubscriptionRecord> {
    this.requireOwner(user);
    const row = await this.requireRequested(this.requireBusinessId(user), id);
    const subscription = await subscriptionRepository.updateStatus(
      {
        id,
        businessId: row.businessId,
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      user.id,
      reason,
    );
    await auditLogService.create({
      businessId: row.businessId,
      userId: user.id,
      action: 'REJECT_SUBSCRIPTION',
      entityType: 'VehicleSubscription',
      entityId: subscription.id,
      oldData: { status: row.status },
      newData: { status: subscription.status, rejectionReason: reason },
    });
    await notificationService.create({
      userId: subscription.customerId,
      type: 'SUBSCRIPTION_REJECTED',
      title: 'Subscription rejected',
      message: reason,
      actionUrl: `/customer/plans`,
      metadata: { subscriptionId: subscription.id },
    });
    return subscription;
  }

  async activate(user: AppUser, id: string, remarks?: string): Promise<SubscriptionRecord> {
    this.requireOwner(user);
    const row = await this.requireSubscription(this.requireBusinessId(user), id);
    if (row.status !== 'PAYMENT_COMPLETED')
      throw new AppError('Only paid subscriptions can be activated.', HttpStatus.CONFLICT);
    const subscription = await subscriptionRepository.activate(
      row.businessId,
      id,
      user.id,
      remarks,
    );
    await auditLogService.create({
      businessId: row.businessId,
      userId: user.id,
      action: 'ACTIVATE_SUBSCRIPTION',
      entityType: 'VehicleSubscription',
      entityId: subscription.id,
      oldData: { status: row.status },
      newData: {
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        restDay: 'MONDAY',
      },
    });
    await notificationService.create({
      userId: subscription.customerId,
      type: 'SUBSCRIPTION_APPROVED',
      title: 'Subscription activated',
      message: 'Your subscription is active. Monday is kept as the weekly rest day.',
      actionUrl: `/customer/calendar`,
      metadata: { subscriptionId: subscription.id },
    });
    return subscription;
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  optBool(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private async requireSubscription(businessId: string, id: string): Promise<SubscriptionRecord> {
    const row = await subscriptionRepository.findById(businessId, id);
    if (!row) throw new AppError('Subscription was not found.', HttpStatus.NOT_FOUND);
    return row;
  }

  private async requireRequested(businessId: string, id: string): Promise<SubscriptionRecord> {
    const row = await this.requireSubscription(businessId, id);
    if (row.status !== 'REQUESTED')
      throw new AppError('Only requested subscriptions can be reviewed.', HttpStatus.CONFLICT);
    return row;
  }

  private ensureCanAccess(user: AppUser, row: SubscriptionRecord): void {
    if (user.role === 'CUSTOMER' && row.customerId !== user.id)
      throw new AppError('Subscription was not found.', HttpStatus.NOT_FOUND);
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can review subscriptions.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }

  private async notifyOwner(
    businessId: string,
    input: {
      type: 'SUBSCRIPTION_REQUEST';
      title: string;
      message: string;
      actionUrl: string;
      metadata: unknown;
    },
  ): Promise<void> {
    const ownerId = await complaintRepository.findOwnerId(businessId);
    if (!ownerId) return;
    await notificationService.create({ userId: ownerId, ...input });
  }
}

export const subscriptionService = new SubscriptionService();
