import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { CustomerDashboardSummary, OwnerDashboardSummary } from '../models/dashboard.model.js';
import { dashboardRepository } from '../repositories/dashboard/index.js';
import { AppError } from '../utils/app-error.js';

export class DashboardService {
  ownerSummary(user: AppUser): Promise<OwnerDashboardSummary> {
    if (user.role !== 'OWNER') throw new AppError('Only owners can view owner dashboard summary.', HttpStatus.FORBIDDEN);
    return dashboardRepository.ownerSummary(this.requireBusinessId(user));
  }

  customerSummary(user: AppUser): Promise<CustomerDashboardSummary> {
    if (user.role !== 'CUSTOMER') throw new AppError('Only customers can view customer dashboard summary.', HttpStatus.FORBIDDEN);
    return dashboardRepository.customerSummary(this.requireBusinessId(user), user.id);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const dashboardService = new DashboardService();
