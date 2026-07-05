export type BookingStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED';

export type BookingRecord = {
  id: string;
  businessId: string;
  customerId: string;
  vehicleId: string;
  serviceId?: string | null;
  subscriptionId?: string | null;
  workerId?: string | null;
  receiptNumber?: string | null;
  scheduledDate: Date;
  amount?: string | null;
  address?: string | null;
  notes?: string | null;
  status: BookingStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  skipReason?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  createdAt: Date;
};

export type CreateBookingInput = {
  businessId: string;
  customerId: string;
  vehicleId: string;
  serviceId?: string;
  scheduledDate: Date;
  amount?: number;
  address?: string;
  notes?: string;
};

export type UpdateBookingStatusInput = {
  id: string;
  businessId: string;
  status: BookingStatus;
  workerId?: string;
  skipReason?: string;
};
