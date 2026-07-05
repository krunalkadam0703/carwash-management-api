import { redisService } from '../../infrastructure/redis/index.js';
import type { CustomerDashboardSummary, OwnerDashboardSummary } from '../../models/dashboard.model.js';

const TTL_SECONDS = 120;
const ownerKey = (businessId: string): string => `dashboard:${businessId}:owner`;
const customerKey = (businessId: string, customerId: string): string => `dashboard:${businessId}:customer:${customerId}`;

export class DashboardCacheRepository {
  async findOwner(businessId: string): Promise<OwnerDashboardSummary | null> {
    try {
      const value = await redisService.get(ownerKey(businessId));
      return value ? (JSON.parse(value) as OwnerDashboardSummary) : null;
    } catch {
      return null;
    }
  }

  async saveOwner(businessId: string, summary: OwnerDashboardSummary): Promise<void> {
    try {
      await redisService.set(ownerKey(businessId), JSON.stringify(summary), TTL_SECONDS);
    } catch {}
  }

  async findCustomer(businessId: string, customerId: string): Promise<CustomerDashboardSummary | null> {
    try {
      const value = await redisService.get(customerKey(businessId, customerId));
      return value ? (JSON.parse(value) as CustomerDashboardSummary) : null;
    } catch {
      return null;
    }
  }

  async saveCustomer(businessId: string, customerId: string, summary: CustomerDashboardSummary): Promise<void> {
    try {
      await redisService.set(customerKey(businessId, customerId), JSON.stringify(summary), TTL_SECONDS);
    } catch {}
  }
}

export const dashboardCacheRepository = new DashboardCacheRepository();
