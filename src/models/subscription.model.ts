export type SubscriptionStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAYMENT_PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type SubscriptionRecord = {
  id: string;
  businessId: string;
  customerId: string;
  vehicleId: string;
  planId: string;
  suggestedPlanId?: string | null;
  status: SubscriptionStatus;
  requestedAt: Date;
  approvedAt?: Date | null;
  approvedById?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  amount: string;
  autoRenew: boolean;
  washesUsed: number;
  expiryReminderSent: boolean;
  renewalReminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSubscriptionInput = {
  businessId: string;
  customerId: string;
  vehicleId: string;
  planId: string;
  suggestedPlanId?: string;
  amount: number;
  autoRenew?: boolean;
};

export type UpdateSubscriptionStatusInput = {
  id: string;
  businessId: string;
  status: SubscriptionStatus;
  approvedById?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
};
