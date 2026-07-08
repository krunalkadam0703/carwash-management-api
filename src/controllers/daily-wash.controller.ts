import { Request, Response } from 'express';

import type { AuthenticatedUser } from '../models/auth.model.js';
import { dailyWashService } from '../services/daily-wash.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { HttpStatus } from '../constants/http.js';

export class DailyWashController {
  list = async (req: Request, res: Response): Promise<void> => {
    const dailyWashes = await dailyWashService.list(
      this.user(req),
      req.query.from
        ? dailyWashService.date(req.query.from)
        : req.query.date
          ? dailyWashService.date(req.query.date)
          : undefined,
      req.query.to ? dailyWashService.date(req.query.to) : undefined,
    );
    ApiResponse.success(res, { dailyWashes }, 'Daily washes loaded.');
  };

  generate = async (req: Request, res: Response): Promise<void> => {
    const dailyWashes = await dailyWashService.generate(
      this.user(req),
      dailyWashService.date(req.body.date),
    );
    ApiResponse.success(res, { dailyWashes }, 'Daily washes generated.');
  };

  start = async (req: Request, res: Response): Promise<void> => {
    const dailyWash = await dailyWashService.start(
      this.user(req),
      dailyWashService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { dailyWash }, 'Daily wash started.');
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const dailyWash = await dailyWashService.complete(
      this.user(req),
      dailyWashService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { dailyWash }, 'Daily wash completed.');
  };

  unavailable = async (req: Request, res: Response): Promise<void> => {
    const dailyWash = await dailyWashService.unavailable(
      this.user(req),
      dailyWashService.text(req.params.id, 'id'),
      dailyWashService.optText(req.body.reason),
    );
    ApiResponse.success(res, { dailyWash }, 'Daily wash marked unavailable.');
  };

  updateSlot = async (req: Request, res: Response): Promise<void> => {
    const dailyWash = await dailyWashService.updateSlot(
      this.user(req),
      dailyWashService.text(req.params.id, 'id'),
      dailyWashService.text(req.body.slot, 'slot'),
    );
    ApiResponse.success(res, { dailyWash }, 'Daily wash slot updated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const dailyWashController = new DailyWashController();
