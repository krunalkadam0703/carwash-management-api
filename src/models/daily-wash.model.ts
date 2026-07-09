export type DailyWashStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'UNAVAILABLE'
  | 'CANCELLED';

export type DailyWashRecord = {
  id: string;
  businessId: string;
  subscriptionId: string;
  customerId: string;
  vehicleId: string;
  washDate: Date;
  status: DailyWashStatus;
  unavailableReason?: string | null;
  slotOverride?: string | null;
  assignedWorkerId?: string | null;
  temporaryWorkerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ActiveSubscriptionForWash = {
  id: string;
  businessId: string;
  customerId: string;
  vehicleId: string;
};

export type UpdateDailyWashInput = {
  id: string;
  businessId: string;
  status: DailyWashStatus;
  unavailableReason?: string;
};
