import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { planService } from '../services/plan.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination } from '../utils/pagination.js';

export class PlanController {
  list = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    if (pagination) {
      const result = await planService.listPage(this.user(req), pagination);
      ApiResponse.success(res, { plans: result.items, pagination: result.pagination }, 'Plans loaded.');
      return;
    }
    const plans = await planService.list(this.user(req), req.query.activeOnly === 'true');
    ApiResponse.success(res, { plans }, 'Plans loaded.');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const plan = await planService.getById(this.user(req), planService.text(req.params.id, 'id'));
    ApiResponse.success(res, { plan }, 'Plan loaded.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const plan = await planService.create(this.user(req), {
      vehicleTypeId: planService.text(req.body.vehicleTypeId, 'vehicleTypeId'),
      name: planService.text(req.body.name, 'name'),
      description: planService.optText(req.body.description),
      category: planService.optText(req.body.category),
      price: planService.money(req.body.price),
      durationDays: planService.int(req.body.durationDays, 'durationDays'),
      washesTotal: planService.int(req.body.washesTotal, 'washesTotal'),
      validityDays: planService.optInt(req.body.validityDays, 'validityDays'),
      durationMonths: planService.optInt(req.body.durationMonths, 'durationMonths'),
      dailyWash: planService.bool(req.body.dailyWash, true),
      isFeatured: planService.bool(req.body.isFeatured),
      isActive: planService.bool(req.body.isActive, true),
      interiorCleaning: planService.bool(req.body.interiorCleaning),
      foamWash: planService.bool(req.body.foamWash),
      ceramicCoating: planService.bool(req.body.ceramicCoating),
      serviceIds: planService.ids(req.body.serviceIds),
    });

    ApiResponse.success(res, { plan }, 'Plan created.', HttpStatus.CREATED);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const plan = await planService.update(this.user(req), planService.text(req.params.id, 'id'), {
      vehicleTypeId: planService.optText(req.body.vehicleTypeId),
      name: planService.optText(req.body.name),
      description: planService.nullableText(req.body.description),
      category: planService.nullableText(req.body.category),
      price: planService.optMoney(req.body.price),
      durationDays: planService.optInt(req.body.durationDays, 'durationDays'),
      washesTotal: planService.optInt(req.body.washesTotal, 'washesTotal'),
      validityDays: planService.optInt(req.body.validityDays, 'validityDays'),
      durationMonths: planService.optInt(req.body.durationMonths, 'durationMonths'),
      dailyWash: planService.optBool(req.body.dailyWash),
      isFeatured: planService.optBool(req.body.isFeatured),
      isActive: planService.optBool(req.body.isActive),
      interiorCleaning: planService.optBool(req.body.interiorCleaning),
      foamWash: planService.optBool(req.body.foamWash),
      ceramicCoating: planService.optBool(req.body.ceramicCoating),
      serviceIds: planService.ids(req.body.serviceIds),
    });

    ApiResponse.success(res, { plan }, 'Plan updated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const planController = new PlanController();
