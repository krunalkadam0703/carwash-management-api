import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { imageService } from '../services/image.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class ImageController {
  listVehicleImages = async (req: Request, res: Response): Promise<void> => {
    const images = await imageService.listVehicleImages(
      this.user(req),
      imageService.text(req.params.vehicleId, 'vehicleId'),
    );
    ApiResponse.success(res, { images }, 'Vehicle images loaded.');
  };

  uploadVehicleImage = async (req: Request, res: Response): Promise<void> => {
    const image = await imageService.uploadVehicleImage(
      this.user(req),
      imageService.text(req.params.vehicleId, 'vehicleId'),
      imageService.file(req.file),
      imageService.optText(req.body.caption),
    );

    ApiResponse.success(res, { image }, 'Vehicle image uploaded.', HttpStatus.CREATED);
  };

  uploadDailyWashImage = async (req: Request, res: Response): Promise<void> => {
    const image = await imageService.uploadDailyWashImage(
      this.user(req),
      imageService.text(req.params.dailyWashId, 'dailyWashId'),
      imageService.file(req.file),
      imageService.text(req.body.photoType, 'photoType'),
    );

    ApiResponse.success(res, { image }, 'Daily wash image uploaded.', HttpStatus.CREATED);
  };

  listDailyWashImages = async (req: Request, res: Response): Promise<void> => {
    const images = await imageService.listDailyWashImages(
      this.user(req),
      imageService.text(req.params.dailyWashId, 'dailyWashId'),
    );
    ApiResponse.success(res, { images }, 'Daily wash images loaded.');
  };

  uploadServiceImage = async (req: Request, res: Response): Promise<void> => {
    const image = await imageService.uploadServiceImage(
      this.user(req),
      imageService.text(req.params.serviceId, 'serviceId'),
      imageService.file(req.file),
      imageService.optText(req.body.caption),
      imageService.optInt(req.body.sortOrder),
    );

    ApiResponse.success(res, { image }, 'Service image uploaded.', HttpStatus.CREATED);
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const imageController = new ImageController();
