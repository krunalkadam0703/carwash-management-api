import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { imageService } from '../services/image.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class ImageController {
  uploadVehicleImage = async (req: Request, res: Response): Promise<void> => {
    const image = await imageService.uploadVehicleImage(
      this.user(req),
      imageService.text(req.params.vehicleId, 'vehicleId'),
      imageService.file(req.file),
      imageService.optText(req.body.caption),
    );

    ApiResponse.success(res, { image }, 'Vehicle image uploaded.', HttpStatus.CREATED);
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
