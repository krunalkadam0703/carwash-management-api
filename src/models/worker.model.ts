export type WorkerLiveStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'ON_BREAK';
export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type WorkerStatusRecord = {
  workerId: string;
  businessId: string;
  name?: string;
  email?: string;
  phoneNumber?: string | null;
  isActive?: boolean;
  status: WorkerLiveStatus;
  currentBookingId?: string | null;
  freeAt?: Date | null;
  area?: string | null;
  rating?: { toString(): string } | string | null;
  jobsCompleted: number;
  updatedAt: Date;
};

export type WorkerAssignmentRecord = {
  id: string;
  assignedById?: string | null;
  workerId: string;
  vehicleId: string;
  status: AssignmentStatus;
  assignedAt: Date;
  completedAt?: Date | null;
};

export type UpdateWorkerStatusInput = {
  workerId: string;
  businessId: string;
  status: WorkerLiveStatus;
  area?: string | null;
  freeAt?: Date | null;
};

export type CreateWorkerAssignmentInput = {
  assignedById: string;
  workerId: string;
  vehicleId: string;
};
