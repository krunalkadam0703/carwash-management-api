import { redisService } from '../../infrastructure/redis/index.js';

const unreadKey = (userId: string): string => `notification:${userId}:unread-count`;
const TTL_SECONDS = 120;

export class NotificationCacheRepository {
  async getUnreadCount(userId: string): Promise<number | null> {
    try {
      const value = await redisService.get(unreadKey(userId));
      return value ? Number(value) : null;
    } catch {
      return null;
    }
  }

  async saveUnreadCount(userId: string, count: number): Promise<void> {
    try {
      await redisService.set(unreadKey(userId), String(count), TTL_SECONDS);
    } catch {}
  }

  async invalidateUnreadCount(userId: string): Promise<void> {
    try {
      await redisService.delete(unreadKey(userId));
    } catch {}
  }
}

export const notificationCacheRepository = new NotificationCacheRepository();
