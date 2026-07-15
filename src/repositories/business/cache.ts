import { redisService } from '../../infrastructure/redis/index.js';
import type { BusinessRecord } from '../../models/auth.model.js';

const BUSINESS_CACHE_TTL_SECONDS = 300;
const businessOwnerCacheKey = (ownerId: string): string => `auth:business:owner:${ownerId}`;

export class BusinessCacheRepository {
  async findByOwnerId(ownerId: string): Promise<BusinessRecord | null> {
    try {
      const value = await redisService.get(businessOwnerCacheKey(ownerId));
      return value ? (JSON.parse(value) as BusinessRecord) : null;
    } catch {
      return null;
    }
  }

  async saveByOwnerId(ownerId: string, business: BusinessRecord): Promise<void> {
    try {
      await redisService.set(
        businessOwnerCacheKey(ownerId),
        JSON.stringify(business),
        BUSINESS_CACHE_TTL_SECONDS,
      );
    } catch {
      // Cache failures must not block the primary database flow.
    }
  }
}

export const businessCacheRepository = new BusinessCacheRepository();
