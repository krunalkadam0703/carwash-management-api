import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { CreateNotificationInput, NotificationRecord, NotificationStatus } from '../../models/notification.model.js';

type NotificationDelegate = {
  findMany(args: unknown): Promise<NotificationRecord[]>;
  findFirst(args: unknown): Promise<NotificationRecord | null>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<NotificationRecord>;
  update(args: unknown): Promise<NotificationRecord>;
  updateMany(args: unknown): Promise<unknown>;
};
type AppDb = { notification: NotificationDelegate };

const db = prisma as unknown as AppDb;

export class NotificationPersistentStorageRepository {
  findManyByUserId(userId: string): Promise<NotificationRecord[]> {
    return db.notification.findMany({ where: { userId, status: { not: 'ARCHIVED' } }, orderBy: { createdAt: 'desc' } });
  }

  findById(userId: string, id: string): Promise<NotificationRecord | null> {
    return db.notification.findFirst({ where: { id, userId } });
  }

  countUnread(userId: string): Promise<number> {
    return db.notification.count({ where: { userId, status: 'UNREAD' } });
  }

  create(input: CreateNotificationInput): Promise<NotificationRecord> {
    return db.notification.create({ data: input });
  }

  updateStatus(_userId: string, id: string, status: NotificationStatus): Promise<NotificationRecord> {
    return db.notification.update({
      where: { id },
      data: { status, readAt: status === 'READ' ? new Date() : undefined },
    });
  }

  markAllRead(userId: string): Promise<unknown> {
    return db.notification.updateMany({ where: { userId, status: 'UNREAD' }, data: { status: 'READ', readAt: new Date() } });
  }
}

export const notificationPersistentStorageRepository = new NotificationPersistentStorageRepository();
