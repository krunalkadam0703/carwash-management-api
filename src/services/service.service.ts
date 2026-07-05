import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type {
  CreateServiceInput,
  ServiceRecord,
  UpdateServiceInput,
} from '../models/service.model.js';
import { serviceRepository } from '../repositories/service/index.js';
import { AppError } from '../utils/app-error.js';

export interface ServiceRepositoryPort {
  findManyByBusinessId(businessId: string): Promise<ServiceRecord[]>;
  findById(businessId: string, id: string): Promise<ServiceRecord | null>;
  create(input: CreateServiceInput): Promise<ServiceRecord>;
  update(input: UpdateServiceInput): Promise<ServiceRecord>;
  delete(businessId: string, id: string): Promise<ServiceRecord>;
  existsVehicleTypeForBusiness(businessId: string, vehicleTypeId: string): Promise<boolean>;
}

export class ServiceService {
  constructor(private readonly repository: ServiceRepositoryPort) {}

  async list(user: AppUser): Promise<ServiceRecord[]> {
    const businessId = this.requireBusinessId(user);
    return this.repository.findManyByBusinessId(businessId);
  }

  async getById(user: AppUser, id: string): Promise<ServiceRecord> {
    const businessId = this.requireBusinessId(user);
    const service = await this.repository.findById(businessId, id);

    if (!service) {
      throw new AppError('Service was not found.', HttpStatus.NOT_FOUND);
    }

    return service;
  }

  async create(user: AppUser, input: Omit<CreateServiceInput, 'businessId'>): Promise<ServiceRecord> {
    this.requireOwner(user);

    const businessId = this.requireBusinessId(user);
    await this.ensureVehicleTypeBelongsToBusiness(businessId, input.vehicleTypeId);

    return this.repository.create({
      ...input,
      businessId,
    });
  }

  async update(
    user: AppUser,
    id: string,
    input: Omit<UpdateServiceInput, 'id' | 'businessId'>,
  ): Promise<ServiceRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    await this.getById(user, id);

    if (input.vehicleTypeId) {
      await this.ensureVehicleTypeBelongsToBusiness(businessId, input.vehicleTypeId);
    }

    return this.repository.update({
      ...input,
      id,
      businessId,
    });
  }

  async delete(user: AppUser, id: string): Promise<ServiceRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    await this.getById(user, id);

    return this.repository.delete(businessId, id);
  }

  parseRequiredText(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new AppError(fieldName + ' is required.', HttpStatus.BAD_REQUEST);
    }

    return value.trim();
  }

  parseOptionalText(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  parseNullableText(value: unknown): string | null | undefined {
    if (value === null) {
      return null;
    }

    return this.parseOptionalText(value);
  }

  parseRequiredPrice(value: unknown): number {
    const price = Number(value);

    if (!Number.isFinite(price) || price < 0) {
      throw new AppError('basePrice must be a valid positive number.', HttpStatus.BAD_REQUEST);
    }

    return price;
  }

  parseOptionalPrice(value: unknown): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.parseRequiredPrice(value);
  }

  parseOptionalDuration(value: unknown): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const duration = Number(value);

    if (!Number.isInteger(duration) || duration <= 0) {
      throw new AppError('durationMinutes must be a positive integer.', HttpStatus.BAD_REQUEST);
    }

    return duration;
  }

  parseOptionalBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private async ensureVehicleTypeBelongsToBusiness(
    businessId: string,
    vehicleTypeId: string,
  ): Promise<void> {
    const exists = await this.repository.existsVehicleTypeForBusiness(businessId, vehicleTypeId);

    if (!exists) {
      throw new AppError('Vehicle type was not found for this business.', HttpStatus.NOT_FOUND);
    }
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER') {
      throw new AppError('Only owners can manage services.', HttpStatus.FORBIDDEN);
    }
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) {
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    }

    return user.businessId;
  }
}

export const serviceService = new ServiceService(serviceRepository);
