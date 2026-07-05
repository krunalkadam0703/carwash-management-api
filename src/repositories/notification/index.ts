import type { CreateNotificationInput, NotificationRecord, NotificationStatus } from '../../models/notification.model.js';
import { notificationCacheRepository } from './cache.js';
import { notificationPersistentStorageRepository } from './persistent-storage.js';

export class NotificationRepository {
  findManyByUserId(userId: string): Promise<NotificationRecord[]> {
    return notificationPersistentStorageRepository.findManyByUserId(userId);
  }

  findById(userId: string, id: string): Promise<NotificationRecord | null> {
    return notificationPersistentStorageRepository.findById(userId, id);
  }

  async countUnread(userId: string): Promise<number> {
    const cached = await notificationCacheRepository.getUnreadCount(userId);
    if (cached !== null) return cached;

    const count = await notificationPersistentStorageRepository.countUnread(userId);
    await notificationCacheRepository.saveUnreadCount(userId, count);
    return count;
  }

  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const notification = await notificationPersistentStorageRepository.create(input);
    await notificationCacheRepository.invalidateUnreadCount(input.userId);
    return notification;
  }

  async updateStatus(userId: string, id: string, status: NotificationStatus): Promise<NotificationRecord> {
    const notification = await notificationPersistentStorageRepository.updateStatus(userId, id, status);
    await notificationCacheRepository.invalidateUnreadCount(userId);
    return notification;
  }

  async markAllRead(userId: string): Promise<void> {
    await notificationPersistentStorageRepository.markAllRead(userId);
    await notificationCacheRepository.invalidateUnreadCount(userId);
  }
}

export const notificationRepository = new NotificationRepository();
