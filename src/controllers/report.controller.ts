import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { reportService } from '../services/report.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class ReportController {
  ownerSummary = async (req: Request, res: Response): Promise<void> => {
    const summary = await reportService.ownerSummary(this.user(req), reportService.range(req.query.from, req.query.to));
    ApiResponse.success(res, { summary }, 'Owner report summary loaded.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const reportController = new ReportController();
