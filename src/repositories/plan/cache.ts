import { redisService } from '../../infrastructure/redis/index.js';
import type { PlanRecord } from '../../models/plan.model.js';

const TTL_SECONDS = 300;
const listKey = (businessId: string): string => `plan:${businessId}:list`;
const activeListKey = (businessId: string): string => `plan:${businessId}:active`;

export class PlanCacheRepository {
  async findMany(businessId: string, activeOnly = false): Promise<PlanRecord[] | null> {
    try {
      const value = await redisService.get(
        activeOnly ? activeListKey(businessId) : listKey(businessId),
      );
      return value ? (JSON.parse(value) as PlanRecord[]) : null;
    } catch {
      return null;
    }
  }

  async saveMany(businessId: string, plans: PlanRecord[], activeOnly = false): Promise<void> {
    try {
      await redisService.set(
        activeOnly ? activeListKey(businessId) : listKey(businessId),
        JSON.stringify(plans),
        TTL_SECONDS,
      );
    } catch {}
  }

  async invalidateBusiness(businessId: string): Promise<void> {
    try {
      await redisService.deleteMany([listKey(businessId), activeListKey(businessId)]);
    } catch {}
  }
}

export const planCacheRepository = new PlanCacheRepository();
