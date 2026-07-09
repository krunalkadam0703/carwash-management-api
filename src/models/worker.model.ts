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
  worker?: { name: string; email: string; phoneNumber?: string | null };
  vehicle?: {
    vehicleNumber: string;
    vehicleName?: string | null;
    brand?: string | null;
    model?: string | null;
    location?: string | null;
    availableTimeSlot?: string | null;
    customer?: { name: string; phoneNumber?: string | null; address?: string | null };
  };
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
