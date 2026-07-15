import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { CreateNotificationInput, NotificationRecord } from '../models/notification.model.js';
import { notificationRepository } from '../repositories/notification/index.js';
import { AppError } from '../utils/app-error.js';

export class NotificationService {
  list(user: AppUser): Promise<NotificationRecord[]> {
    return notificationRepository.findManyByUserId(user.id);
  }

  unreadCount(user: AppUser): Promise<number> {
    return notificationRepository.countUnread(user.id);
  }

  create(input: CreateNotificationInput): Promise<NotificationRecord> {
    return notificationRepository.create(input);
  }

  async markRead(user: AppUser, id: string): Promise<NotificationRecord> {
    await this.requireNotification(user.id, id);
    return notificationRepository.updateStatus(user.id, id, 'READ');
  }

  async archive(user: AppUser, id: string): Promise<NotificationRecord> {
    await this.requireNotification(user.id, id);
    return notificationRepository.updateStatus(user.id, id, 'ARCHIVED');
  }

  markAllRead(user: AppUser): Promise<void> {
    return notificationRepository.markAllRead(user.id);
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  private async requireNotification(userId: string, id: string): Promise<NotificationRecord> {
    const notification = await notificationRepository.findById(userId, id);
    if (!notification) throw new AppError('Notification was not found.', HttpStatus.NOT_FOUND);
    return notification;
  }
}

export const notificationService = new NotificationService();
