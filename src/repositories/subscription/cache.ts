import { redisService } from '../../infrastructure/redis/index.js';
import type { SubscriptionRecord } from '../../models/subscription.model.js';

const TTL_SECONDS = 180;
const listKey = (businessId: string): string => `subscription:${businessId}:list`;
const customerKey = (businessId: string, customerId: string): string => `subscription:${businessId}:customer:${customerId}`;

export class SubscriptionCacheRepository {
  async findMany(businessId: string, customerId?: string): Promise<SubscriptionRecord[] | null> {
    try {
      const value = await redisService.get(customerId ? customerKey(businessId, customerId) : listKey(businessId));
      return value ? (JSON.parse(value) as SubscriptionRecord[]) : null;
    } catch {
      return null;
    }
  }

  async saveMany(businessId: string, rows: SubscriptionRecord[], customerId?: string): Promise<void> {
    try {
      await redisService.set(customerId ? customerKey(businessId, customerId) : listKey(businessId), JSON.stringify(rows), TTL_SECONDS);
    } catch {}
  }

  async invalidateBusiness(businessId: string, customerId?: string): Promise<void> {
    try {
      await redisService.delete(listKey(businessId));
      if (customerId) await redisService.delete(customerKey(businessId, customerId));
    } catch {}
  }
}

export const subscriptionCacheRepository = new SubscriptionCacheRepository();
