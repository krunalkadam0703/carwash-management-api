import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { serviceService } from '../services/service.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination } from '../utils/pagination.js';

export class ServiceController {
  list = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    if (pagination) {
      const result = await serviceService.listPage(this.getSessionUser(req), pagination);
      ApiResponse.success(
        res,
        { services: result.items, pagination: result.pagination },
        'Services loaded.',
      );
      return;
    }
    const services = await serviceService.list(this.getSessionUser(req));
    ApiResponse.success(res, { services }, 'Services loaded.');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const service = await serviceService.getById(
      this.getSessionUser(req),
      serviceService.parseRequiredText(req.params.id, 'id'),
    );

    ApiResponse.success(res, { service }, 'Service loaded.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const service = await serviceService.create(this.getSessionUser(req), {
      vehicleTypeId: serviceService.parseRequiredText(req.body.vehicleTypeId, 'vehicleTypeId'),
      name: serviceService.parseRequiredText(req.body.name, 'name'),
      description: serviceService.parseOptionalText(req.body.description),
      basePrice: serviceService.parseRequiredPrice(req.body.basePrice),
      durationMinutes: serviceService.parseOptionalDuration(req.body.durationMinutes),
      isActive: serviceService.parseOptionalBoolean(req.body.isActive),
    });

    ApiResponse.success(res, { service }, 'Service created.', HttpStatus.CREATED);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const service = await serviceService.update(
      this.getSessionUser(req),
      serviceService.parseRequiredText(req.params.id, 'id'),
      {
        vehicleTypeId: serviceService.parseOptionalText(req.body.vehicleTypeId),
        name: serviceService.parseOptionalText(req.body.name),
        description: serviceService.parseNullableText(req.body.description),
        basePrice: serviceService.parseOptionalPrice(req.body.basePrice),
        durationMinutes: serviceService.parseOptionalDuration(req.body.durationMinutes),
        isActive: serviceService.parseOptionalBoolean(req.body.isActive),
      },
    );

    ApiResponse.success(res, { service }, 'Service updated.');
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const service = await serviceService.delete(
      this.getSessionUser(req),
      serviceService.parseRequiredText(req.params.id, 'id'),
    );

    ApiResponse.success(res, { service }, 'Service deleted.');
  };

  private getSessionUser(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;

    if (!user) {
      throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}

export const serviceController = new ServiceController();
