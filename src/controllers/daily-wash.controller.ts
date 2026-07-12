import { Request, Response } from 'express';

import type { AuthenticatedUser } from '../models/auth.model.js';
import { dailyWashService } from '../services/daily-wash.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { HttpStatus } from '../constants/http.js';
import { parsePagination } from '../utils/pagination.js';

export class DailyWashController {
  list = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    const from = req.query.from
      ? dailyWashService.date(req.query.from)
      : req.query.date
        ? dailyWashService.date(req.query.date)
        : undefined;
    const to = req.query.to ? dailyWashService.date(req.query.to) : undefined;
    if (pagination) {
      const result = await dailyWashService.listPage(this.user(req), pagination, from, to);
      ApiResponse.success(res, { dailyWashes: result.items, pagination: result.pagination }, 'Daily washes loaded.');
      return;
    }
    const dailyWashes = await dailyWashService.list(
      this.user(req),
      from,
      to,
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

  assignWorker = async (req: Request, res: Response): Promise<void> => {
    const dailyWash = await dailyWashService.assignTemporaryWorker(
      this.user(req),
      dailyWashService.text(req.params.id, 'id'),
      dailyWashService.text(req.body.workerId, 'workerId'),
    );
    ApiResponse.success(res, { dailyWash }, 'Temporary worker assigned.');
  };

  updateQueueOrder = async (req: Request, res: Response): Promise<void> => {
    const dailyWash = await dailyWashService.updateQueueOrder(
      this.user(req),
      dailyWashService.text(req.params.id, 'id'),
      dailyWashService.number(req.body.queueOrder, 'queueOrder'),
    );
    ApiResponse.success(res, { dailyWash }, 'Queue order updated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const dailyWashController = new DailyWashController();
