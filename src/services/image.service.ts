import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { ServiceImageRecord, VehicleImageRecord } from '../models/image.model.js';
import { imageRepository } from '../repositories/image/index.js';
import { localFileStorageService } from './local-file-storage.service.js';
import { AppError } from '../utils/app-error.js';

export class ImageService {
  async uploadVehicleImage(
    user: AppUser,
    vehicleId: string,
    file: Express.Multer.File,
    caption?: string,
  ): Promise<VehicleImageRecord> {
    const businessId = this.requireBusinessId(user);
    const vehicle = await imageRepository.findVehicle(businessId, vehicleId);
    if (!vehicle || (user.role === 'CUSTOMER' && vehicle.customerId !== user.id))
      throw new AppError('Vehicle was not found.', HttpStatus.NOT_FOUND);

    const stored = await localFileStorageService.saveBuffer(
      'vehicles',
      file.buffer,
      file.originalname,
    );
    return imageRepository.createVehicleImage({ vehicleId, imageUrl: stored.publicUrl, caption });
  }

  async uploadServiceImage(
    user: AppUser,
    serviceId: string,
    file: Express.Multer.File,
    caption?: string,
    sortOrder?: number,
  ): Promise<ServiceImageRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    if (!(await imageRepository.findService(businessId, serviceId)))
      throw new AppError('Service was not found.', HttpStatus.NOT_FOUND);

    const stored = await localFileStorageService.saveBuffer(
      'services',
      file.buffer,
      file.originalname,
    );
    return imageRepository.createServiceImage({
      serviceId,
      imageUrl: stored.publicUrl,
      caption,
      sortOrder,
    });
  }

  file(value: Express.Multer.File | undefined): Express.Multer.File {
    if (!value) throw new AppError('image is required.', HttpStatus.BAD_REQUEST);
    return value;
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  optInt(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0)
      throw new AppError('sortOrder must be a positive integer.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can upload service images.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const imageService = new ImageService();
