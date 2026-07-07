import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { vehicleService } from '../services/vehicle.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class VehicleController {
  list = async (req: Request, res: Response): Promise<void> => {
    const vehicles = await vehicleService.list(this.user(req));
    ApiResponse.success(res, { vehicles }, 'Vehicles loaded.');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const vehicle = await vehicleService.getById(
      this.user(req),
      vehicleService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { vehicle }, 'Vehicle loaded.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const vehicle = await vehicleService.create(this.user(req), {
      customerId: vehicleService.optText(req.body.customerId),
      vehicleTypeId: vehicleService.text(req.body.vehicleTypeId, 'vehicleTypeId'),
      vehicleNumber: vehicleService.text(req.body.vehicleNumber, 'vehicleNumber'),
      vehicleName: vehicleService.optText(req.body.vehicleName),
      brand: vehicleService.optText(req.body.brand),
      model: vehicleService.optText(req.body.model),
      color: vehicleService.optText(req.body.color),
      location: vehicleService.optText(req.body.location),
      availableTimeSlot: vehicleService.optText(req.body.availableTimeSlot),
    });

    ApiResponse.success(res, { vehicle }, 'Vehicle created.', HttpStatus.CREATED);
  };

  update = async (req: Request, res: Response): Promise<void> => {
<<<<<<< HEAD
    const vehicle = await vehicleService.update(this.user(req), vehicleService.text(req.params.id, 'id'), {
      customerId: vehicleService.optText(req.body.customerId),
      vehicleTypeId: vehicleService.optText(req.body.vehicleTypeId),
      vehicleNumber: vehicleService.optText(req.body.vehicleNumber),
      vehicleName: vehicleService.nullableText(req.body.vehicleName),
      brand: vehicleService.nullableText(req.body.brand),
      model: vehicleService.nullableText(req.body.model),
      color: vehicleService.nullableText(req.body.color),
      location: vehicleService.nullableText(req.body.location),
      availableTimeSlot: vehicleService.nullableText(req.body.availableTimeSlot),
    });
=======
    const vehicle = await vehicleService.update(
      this.user(req),
      vehicleService.text(req.params.id, 'id'),
      {
        customerId: vehicleService.optText(req.body.customerId),
        vehicleTypeId: vehicleService.optText(req.body.vehicleTypeId),
        vehicleNumber: vehicleService.optText(req.body.vehicleNumber),
        vehicleName: vehicleService.nullableText(req.body.vehicleName),
        brand: vehicleService.nullableText(req.body.brand),
        model: vehicleService.nullableText(req.body.model),
        color: vehicleService.nullableText(req.body.color),
        location: vehicleService.nullableText(req.body.location),
      },
    );
>>>>>>> 2dd5b21277ed50e9e0f6beb135dbf619ec869da4

    ApiResponse.success(res, { vehicle }, 'Vehicle updated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const vehicleController = new VehicleController();
