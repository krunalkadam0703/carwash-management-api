export type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export type ComplaintRecord = {
  id: string;
  businessId: string;
  customerId: string;
  workerId?: string | null;
  createdById?: string | null;
  dailyWashId?: string | null;
  complaintDate: Date;
  subject: string;
  message: string;
  conclusion?: string | null;
  status: ComplaintStatus;
  resolvedAt?: Date | null;
  customer?: ComplaintUser | null;
  worker?: ComplaintUser | null;
  createdBy?: ComplaintUser | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ComplaintUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
};

export type CreateComplaintInput = {
  businessId: string;
  customerId: string;
  workerId?: string | null;
  createdById: string;
  dailyWashId: string;
  complaintDate: Date;
  subject: string;
  message: string;
};

export type UpdateComplaintInput = {
  id: string;
  businessId: string;
  status: ComplaintStatus;
  conclusion?: string;
};
