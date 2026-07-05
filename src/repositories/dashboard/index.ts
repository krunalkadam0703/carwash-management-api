import type { CustomerDashboardSummary, OwnerDashboardSummary } from '../../models/dashboard.model.js';
import { dashboardCacheRepository } from './cache.js';
import { dashboardPersistentStorageRepository } from './persistent-storage.js';

export class DashboardRepository {
  async ownerSummary(businessId: string): Promise<OwnerDashboardSummary> {
    const cached = await dashboardCacheRepository.findOwner(businessId);
    if (cached) return cached;

    const summary = await dashboardPersistentStorageRepository.ownerSummary(businessId);
    await dashboardCacheRepository.saveOwner(businessId, summary);
    return summary;
  }

  async customerSummary(businessId: string, customerId: string): Promise<CustomerDashboardSummary> {
    const cached = await dashboardCacheRepository.findCustomer(businessId, customerId);
    if (cached) return cached;

    const summary = await dashboardPersistentStorageRepository.customerSummary(businessId, customerId);
    await dashboardCacheRepository.saveCustomer(businessId, customerId, summary);
    return summary;
  }
}

export const dashboardRepository = new DashboardRepository();
