import { redisService } from '../../infrastructure/redis/index.js';
import type { AppUser } from '../../models/auth.model.js';

const USER_CACHE_TTL_SECONDS = 300;
const userCacheKey = (id: string): string => `auth:user:${id}`;

export class UserCacheRepository {
  async findById(id: string): Promise<AppUser | null> {
    try {
      const value = await redisService.get(userCacheKey(id));
      return value ? (JSON.parse(value) as AppUser) : null;
    } catch {
      return null;
    }
  }

  async save(user: AppUser): Promise<void> {
    try {
      await redisService.set(userCacheKey(user.id), JSON.stringify(user), USER_CACHE_TTL_SECONDS);
    } catch {
      // Cache failures must not block the primary database flow.
    }
  }
}

export const userCacheRepository = new UserCacheRepository();
