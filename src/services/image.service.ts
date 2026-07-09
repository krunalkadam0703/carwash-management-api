import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { DailyWashImageRecord, ServiceImageRecord, VehicleImageRecord } from '../models/image.model.js';
import { imageRepository } from '../repositories/image/index.js';
import { workerRepository } from '../repositories/worker/index.js';
import { redisService } from '../infrastructure/redis/index.js';
import { localFileStorageService } from './local-file-storage.service.js';
import { AppError } from '../utils/app-error.js';

const workerKey = (businessId: string, dailyWashId: string): string =>
  `daily-wash-worker:${businessId}:${dailyWashId}`;

export class ImageService {
  async listVehicleImages(user: AppUser, vehicleId: string): Promise<VehicleImageRecord[]> {
    const businessId = this.requireBusinessId(user);
    const vehicle = await imageRepository.findVehicle(businessId, vehicleId);
    if (!vehicle || (user.role === 'CUSTOMER' && vehicle.customerId !== user.id))
      throw new AppError('Vehicle was not found.', HttpStatus.NOT_FOUND);
    return imageRepository.findVehicleImages(vehicleId);
  }

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

  async uploadDailyWashImage(
    user: AppUser,
    dailyWashId: string,
    file: Express.Multer.File,
    photoType: string,
  ): Promise<DailyWashImageRecord> {
    if (!['OWNER', 'WORKER'].includes(user.role))
      throw new AppError('Only workers or owners can upload wash photos.', HttpStatus.FORBIDDEN);
    const dailyWash = await imageRepository.findDailyWash(this.requireBusinessId(user), dailyWashId);
    if (!dailyWash) throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    const type = this.photoType(photoType);
    if (dailyWash.status === 'COMPLETED')
      throw new AppError('This vehicle is already washed for today.', HttpStatus.CONFLICT);
    if (user.role === 'WORKER') {
      const override = await redisService.get(workerKey(this.requireBusinessId(user), dailyWashId));
      const allowed = override ? override === user.id : await this.isAssignedWorker(user, dailyWash.vehicleId);
      if (!allowed) throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    }
    const stored = await localFileStorageService.saveBuffer(
      'daily-cleanings',
      file.buffer,
      file.originalname,
    );
    return imageRepository.createDailyWashImage({
      dailyWashId,
      imageUrl: stored.publicUrl,
      photoType: type,
    });
  }

  async listDailyWashImages(user: AppUser, dailyWashId: string): Promise<DailyWashImageRecord[]> {
    const dailyWash = await imageRepository.findDailyWash(this.requireBusinessId(user), dailyWashId);
    if (!dailyWash || (user.role === 'CUSTOMER' && dailyWash.customerId !== user.id))
      throw new AppError('Daily wash was not found.', HttpStatus.NOT_FOUND);
    return imageRepository.findDailyWashImages(dailyWashId);
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

  photoType(value: unknown): string {
    const type = this.text(value, 'photoType').toUpperCase();
    if (!['DONE', 'NOT_DONE'].includes(type))
      throw new AppError('photoType must be DONE or NOT_DONE.', HttpStatus.BAD_REQUEST);
    return type;
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

  private async isAssignedWorker(user: AppUser, vehicleId: string): Promise<boolean> {
    const businessId = this.requireBusinessId(user);
    const assignments = await workerRepository.findAssignmentsByBusinessId(
      businessId,
      user.id,
    );
    return assignments.some((item) => item.vehicleId === vehicleId && item.status !== 'COMPLETED');
  }
}

export const imageService = new ImageService();
