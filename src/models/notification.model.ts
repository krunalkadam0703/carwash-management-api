export type NotificationType =
  | 'SUBSCRIPTION_REQUEST'
  | 'SUBSCRIPTION_APPROVED'
  | 'SUBSCRIPTION_REJECTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'VEHICLE_ASSIGNED'
  | 'VEHICLE_UNASSIGNED'
  | 'CAR_WASH_STARTED'
  | 'CAR_WASH_COMPLETED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SYSTEM';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  actionUrl?: string | null;
  metadata?: unknown;
  readAt?: Date | null;
  createdAt: Date;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: unknown;
};
