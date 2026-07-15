import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { CreatePlanInput, PlanRecord, UpdatePlanInput } from '../models/plan.model.js';
import { planRepository } from '../repositories/plan/index.js';
import { AppError } from '../utils/app-error.js';
import type { PaginationInput, PaginatedResult } from '../utils/pagination.js';

type CreateBody = Omit<CreatePlanInput, 'businessId'>;
type UpdateBody = Omit<UpdatePlanInput, 'id' | 'businessId'>;

export class PlanService {
  async list(user: AppUser, activeOnly = false): Promise<PlanRecord[]> {
    return planRepository.findManyByBusinessId(this.requireBusinessId(user), activeOnly);
  }

  async listPage(user: AppUser, input: PaginationInput): Promise<PaginatedResult<PlanRecord>> {
    return planRepository.findPageByBusinessId(this.requireBusinessId(user), input);
  }

  async getById(user: AppUser, id: string): Promise<PlanRecord> {
    const plan = await planRepository.findById(this.requireBusinessId(user), id);
    if (!plan) throw new AppError('Plan was not found.', HttpStatus.NOT_FOUND);
    return plan;
  }

  async create(user: AppUser, input: CreateBody): Promise<PlanRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    await this.ensureVehicleType(businessId, input.vehicleTypeId);
    await this.ensureServices(businessId, input.serviceIds);
    await this.ensureUniquePlan(businessId, input.vehicleTypeId, input.name, input.durationDays);
    return planRepository.create({ ...input, businessId });
  }

  async update(user: AppUser, id: string, input: UpdateBody): Promise<PlanRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    const current = await this.getById(user, id);
    if (input.vehicleTypeId) await this.ensureVehicleType(businessId, input.vehicleTypeId);
    await this.ensureServices(businessId, input.serviceIds);
    await this.ensureUniquePlan(
      businessId,
      input.vehicleTypeId ?? current.vehicleTypeId,
      input.name ?? current.name,
      input.durationDays ?? current.durationDays,
      id,
    );
    return planRepository.update({ ...input, id, businessId });
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  nullableText(value: unknown): string | null | undefined {
    return value === null ? null : this.optText(value);
  }

  money(value: unknown): number {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0)
      throw new AppError('price must be a valid positive number.', HttpStatus.BAD_REQUEST);
    return amount;
  }

  optMoney(value: unknown): number | undefined {
    return value === undefined ? undefined : this.money(value);
  }

  int(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0)
      throw new AppError(field + ' must be a positive integer.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  optInt(value: unknown, field: string): number | undefined {
    return value === undefined ? undefined : this.int(value, field);
  }

  bool(value: unknown, fallback = false): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }

  optBool(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  ids(value: unknown): string[] | undefined {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
      : undefined;
  }

  private async ensureVehicleType(businessId: string, vehicleTypeId: string): Promise<void> {
    if (!(await planRepository.existsVehicleTypeForBusiness(businessId, vehicleTypeId)))
      throw new AppError('Vehicle type was not found.', HttpStatus.NOT_FOUND);
  }

  private async ensureServices(businessId: string, serviceIds?: string[]): Promise<void> {
    if (!serviceIds?.length) return;
    if (
      (await planRepository.countServicesForBusiness(businessId, serviceIds)) !==
      new Set(serviceIds).size
    ) {
      throw new AppError(
        'One or more services were not found for this business.',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async ensureUniquePlan(
    businessId: string,
    vehicleTypeId: string,
    name: string,
    durationDays: number,
    currentId?: string,
  ): Promise<void> {
    const normalizedName = name.trim().toLowerCase();
    const duplicate = (await planRepository.findManyByBusinessId(businessId)).find(
      (plan) =>
        plan.id !== currentId &&
        plan.vehicleTypeId === vehicleTypeId &&
        plan.name.trim().toLowerCase() === normalizedName &&
        plan.durationDays === durationDays,
    );
    if (duplicate)
      throw new AppError(
        'Plan name, vehicle type, and duration must be unique.',
        HttpStatus.CONFLICT,
      );
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can manage plans.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const planService = new PlanService();
