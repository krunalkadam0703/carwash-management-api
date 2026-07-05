export type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export type ComplaintRecord = {
  id: string;
  businessId: string;
  customerId: string;
  bookingId?: string | null;
  subject: string;
  message: string;
  status: ComplaintStatus;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateComplaintInput = {
  businessId: string;
  customerId: string;
  bookingId?: string;
  subject: string;
  message: string;
};

export type UpdateComplaintInput = {
  id: string;
  businessId: string;
  status: ComplaintStatus;
};
