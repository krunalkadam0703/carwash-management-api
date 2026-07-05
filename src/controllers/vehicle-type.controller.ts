import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { vehicleTypeService } from '../services/vehicle-type.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class VehicleTypeController {
  list = async (req: Request, res: Response): Promise<void> => {
    const vehicleTypes = await vehicleTypeService.list(this.getSessionUser(req));
    ApiResponse.success(res, { vehicleTypes }, 'Vehicle types loaded.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const vehicleType = await vehicleTypeService.create(this.getSessionUser(req), {
      name: vehicleTypeService.parseRequiredText(req.body.name, 'name'),
      slug: vehicleTypeService.parseOptionalText(req.body.slug),
      examples: vehicleTypeService.parseOptionalText(req.body.examples),
      icon: vehicleTypeService.parseOptionalText(req.body.icon),
      sortOrder: vehicleTypeService.parseOptionalNumber(req.body.sortOrder),
      isActive: vehicleTypeService.parseOptionalBoolean(req.body.isActive),
    });

    ApiResponse.success(res, { vehicleType }, 'Vehicle type created.', HttpStatus.CREATED);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const vehicleType = await vehicleTypeService.update(this.getSessionUser(req), vehicleTypeService.parseRequiredText(req.params.id, 'id'), {
      name: vehicleTypeService.parseOptionalText(req.body.name),
      slug: vehicleTypeService.parseOptionalText(req.body.slug),
      examples: vehicleTypeService.parseOptionalText(req.body.examples),
      icon: vehicleTypeService.parseOptionalText(req.body.icon),
      sortOrder: vehicleTypeService.parseOptionalNumber(req.body.sortOrder),
      isActive: vehicleTypeService.parseOptionalBoolean(req.body.isActive),
    });

    ApiResponse.success(res, { vehicleType }, 'Vehicle type updated.');
  };

  private getSessionUser(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;

    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);

    return user;
  }
}

export const vehicleTypeController = new VehicleTypeController();
