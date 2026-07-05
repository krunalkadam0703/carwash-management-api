import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { dashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class DashboardController {
  ownerSummary = async (req: Request, res: Response): Promise<void> => {
    const summary = await dashboardService.ownerSummary(this.user(req));
    ApiResponse.success(res, { summary }, 'Owner dashboard summary loaded.');
  };

  customerSummary = async (req: Request, res: Response): Promise<void> => {
    const summary = await dashboardService.customerSummary(this.user(req));
    ApiResponse.success(res, { summary }, 'Customer dashboard summary loaded.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const dashboardController = new DashboardController();
