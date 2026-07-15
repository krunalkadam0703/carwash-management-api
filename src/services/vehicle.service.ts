import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleRecord,
} from '../models/vehicle.model.js';
import { complaintRepository } from '../repositories/complaint/index.js';
import { vehicleRepository } from '../repositories/vehicle/index.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/app-error.js';
import type { PaginationInput, PaginatedResult } from '../utils/pagination.js';

type CreateBody = Omit<CreateVehicleInput, 'businessId' | 'customerId'> & { customerId?: string };
type UpdateBody = Omit<UpdateVehicleInput, 'id' | 'businessId'>;

export class VehicleService {
  async list(user: AppUser): Promise<VehicleRecord[]> {
    const businessId = this.requireBusinessId(user);
    return vehicleRepository.findManyByBusinessId(
      businessId,
      user.role === 'CUSTOMER' ? user.id : undefined,
    );
  }

  async getById(user: AppUser, id: string): Promise<VehicleRecord> {
    const vehicle = await this.requireVehicle(this.requireBusinessId(user), id);
    this.ensureCanAccess(user, vehicle);
    return vehicle;
  }

  async create(user: AppUser, input: CreateBody): Promise<VehicleRecord> {
    const businessId = this.requireBusinessId(user);
    const customerId =
      user.role === 'CUSTOMER' ? user.id : this.text(input.customerId, 'customerId');
    await this.ensureCustomer(businessId, customerId);
    await this.ensureVehicleType(businessId, input.vehicleTypeId);
    if (!input.location)
      throw new AppError('Vehicle address and GPS are required.', HttpStatus.BAD_REQUEST);
    await this.ensureVehicleNumberAvailable(businessId, input.vehicleNumber);
    return vehicleRepository.create({ ...input, businessId, customerId });
  }

  async listPage(user: AppUser, input: PaginationInput): Promise<PaginatedResult<VehicleRecord>> {
    const businessId = this.requireBusinessId(user);
    return vehicleRepository.findPageByBusinessId(
      businessId,
      input,
      user.role === 'CUSTOMER' ? user.id : undefined,
    );
  }

  async update(user: AppUser, id: string, input: UpdateBody): Promise<VehicleRecord> {
    const businessId = this.requireBusinessId(user);
    const vehicle = await this.requireVehicle(businessId, id);
    this.ensureCanAccess(user, vehicle);
    if (
      user.role === 'CUSTOMER' &&
      input.vehicleNumber &&
      input.vehicleNumber !== vehicle.vehicleNumber
    )
      throw new AppError('Vehicle number cannot be changed.', HttpStatus.FORBIDDEN);
    if (input.customerId) this.requireOwner(user);
    if (input.customerId) await this.ensureCustomer(businessId, input.customerId);
    if (input.vehicleTypeId) await this.ensureVehicleType(businessId, input.vehicleTypeId);
    if (input.vehicleNumber)
      await this.ensureVehicleNumberAvailable(businessId, input.vehicleNumber, id);
    const updated = await vehicleRepository.update(
      { ...input, id, businessId },
      vehicle.customerId,
    );
    if (input.availableTimeSlot && input.availableTimeSlot !== vehicle.availableTimeSlot)
      await this.notifyOwnerTimeChanged(businessId, updated);
    return updated;
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

  private async requireVehicle(businessId: string, id: string): Promise<VehicleRecord> {
    const vehicle = await vehicleRepository.findById(businessId, id);
    if (!vehicle) throw new AppError('Vehicle was not found.', HttpStatus.NOT_FOUND);
    return vehicle;
  }

  private async ensureCustomer(businessId: string, customerId: string): Promise<void> {
    if (!(await vehicleRepository.existsCustomerForBusiness(businessId, customerId)))
      throw new AppError('Customer was not found for this business.', HttpStatus.NOT_FOUND);
  }

  private async ensureVehicleType(businessId: string, vehicleTypeId: string): Promise<void> {
    if (!(await vehicleRepository.existsVehicleTypeForBusiness(businessId, vehicleTypeId)))
      throw new AppError('Vehicle type was not found.', HttpStatus.NOT_FOUND);
  }

  private async ensureVehicleNumberAvailable(
    businessId: string,
    vehicleNumber: string,
    currentVehicleId?: string,
  ): Promise<void> {
    const existing = await vehicleRepository.findByVehicleNumber(businessId, vehicleNumber);
    if (existing && existing.id !== currentVehicleId)
      throw new AppError('Vehicle number is already registered.', HttpStatus.CONFLICT);
  }

  private ensureCanAccess(user: AppUser, vehicle: VehicleRecord): void {
    if (user.role === 'CUSTOMER' && vehicle.customerId !== user.id)
      throw new AppError('Vehicle was not found.', HttpStatus.NOT_FOUND);
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can assign vehicles to customers.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }

  private async notifyOwnerTimeChanged(businessId: string, vehicle: VehicleRecord): Promise<void> {
    const ownerId = await complaintRepository.findOwnerId(businessId);
    if (!ownerId) return;
    await notificationService.create({
      userId: ownerId,
      type: 'SYSTEM',
      title: 'Vehicle availability changed',
      message: `${vehicle.vehicleNumber} availability changed to ${vehicle.availableTimeSlot}.`,
      actionUrl: '/vehicles',
      metadata: { vehicleId: vehicle.id },
    });
  }
}

export const vehicleService = new VehicleService();
