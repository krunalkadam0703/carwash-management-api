import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type {
  CreateVehicleTypeInput,
  UpdateVehicleTypeInput,
  VehicleTypeRecord,
} from '../models/vehicle-type.model.js';
import { vehicleTypeRepository } from '../repositories/vehicle-type/index.js';
import { AppError } from '../utils/app-error.js';

export class VehicleTypeService {
  async list(user: AppUser): Promise<VehicleTypeRecord[]> {
    return vehicleTypeRepository.findManyByBusinessId(this.requireBusinessId(user));
  }

  async create(
    user: AppUser,
    input: Omit<CreateVehicleTypeInput, 'businessId' | 'slug'> & { slug?: string },
  ): Promise<VehicleTypeRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    const slug = input.slug ?? this.slugify(input.name);
    await this.ensureSlugAvailable(businessId, slug);

    return vehicleTypeRepository.create({ ...input, businessId, slug });
  }

  async update(
    user: AppUser,
    id: string,
    input: Omit<UpdateVehicleTypeInput, 'id' | 'businessId'>,
  ): Promise<VehicleTypeRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    await this.requireExisting(businessId, id);

    if (input.slug) {
      const existing = await vehicleTypeRepository.findBySlug(businessId, input.slug);

      if (existing && existing.id !== id) {
        throw new AppError('Vehicle type slug already exists.', HttpStatus.CONFLICT);
      }
    }

    return vehicleTypeRepository.update({ ...input, id, businessId });
  }

  parseRequiredText(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0)
      throw new AppError(fieldName + ' is required.', HttpStatus.BAD_REQUEST);

    return value.trim();
  }

  parseOptionalText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  parseOptionalNumber(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0)
      throw new AppError('sortOrder must be a positive integer.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  parseOptionalBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private async requireExisting(businessId: string, id: string): Promise<void> {
    if (!(await vehicleTypeRepository.findById(businessId, id)))
      throw new AppError('Vehicle type was not found.', HttpStatus.NOT_FOUND);
  }

  private async ensureSlugAvailable(businessId: string, slug: string): Promise<void> {
    if (await vehicleTypeRepository.findBySlug(businessId, slug))
      throw new AppError('Vehicle type slug already exists.', HttpStatus.CONFLICT);
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can manage vehicle types.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);

    return user.businessId;
  }
}

export const vehicleTypeService = new VehicleTypeService();
