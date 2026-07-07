import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { CreateWorkerAssignmentInput, UpdateWorkerStatusInput, WorkerAssignmentRecord, WorkerLiveStatus, WorkerStatusRecord } from '../../models/worker.model.js';

type WorkerUser = { id: string; businessId?: string | null; name: string; email: string; phoneNumber?: string | null; isActive: boolean };
type UserDelegate = {
  findFirst(args: unknown): Promise<{ id: string } | null>;
  findMany(args: unknown): Promise<WorkerUser[]>;
};
type VehicleDelegate = { findFirst(args: unknown): Promise<{ id: string } | null> };
type WorkerStatusDelegate = {
  findMany(args: unknown): Promise<WorkerStatusRecord[]>;
  upsert(args: unknown): Promise<WorkerStatusRecord>;
};
type WorkerAssignmentDelegate = {
  findMany(args: unknown): Promise<WorkerAssignmentRecord[]>;
  create(args: unknown): Promise<WorkerAssignmentRecord>;
  update(args: unknown): Promise<WorkerAssignmentRecord>;
};
type AppDb = {
  user: UserDelegate;
  vehicle: VehicleDelegate;
  workerStatus: WorkerStatusDelegate;
  workerAssignment: WorkerAssignmentDelegate;
};

const db = prisma as unknown as AppDb;

export class WorkerPersistentStorageRepository {
  async findStatusesByBusinessId(businessId: string): Promise<WorkerStatusRecord[]> {
    const [workers, statuses] = await Promise.all([
      db.user.findMany({ where: { businessId, role: 'WORKER' }, orderBy: { createdAt: 'desc' } }),
      db.workerStatus.findMany({ where: { businessId }, orderBy: { updatedAt: 'desc' } }),
    ]);
    const statusMap = new Map(statuses.map((status) => [status.workerId, status]));
    return workers.map((worker) => {
      const status = statusMap.get(worker.id);
      return {
        workerId: worker.id,
        businessId,
        name: worker.name,
        email: worker.email,
        phoneNumber: worker.phoneNumber,
        isActive: worker.isActive,
        status: status?.status ?? ('OFFLINE' satisfies WorkerLiveStatus),
        freeAt: status?.freeAt,
        area: status?.area,
        rating: status?.rating,
        jobsCompleted: status?.jobsCompleted ?? 0,
        updatedAt: status?.updatedAt ?? new Date(0),
      };
    });
  }

  async existsWorkerForBusiness(businessId: string, workerId: string): Promise<boolean> {
    return Boolean(await db.user.findFirst({ where: { id: workerId, businessId, role: 'WORKER' }, select: { id: true } }));
  }

  async existsVehicleForBusiness(businessId: string, vehicleId: string): Promise<boolean> {
    return Boolean(await db.vehicle.findFirst({ where: { id: vehicleId, businessId }, select: { id: true } }));
  }

  upsertStatus(input: UpdateWorkerStatusInput): Promise<WorkerStatusRecord> {
    return db.workerStatus.upsert({
      where: { workerId: input.workerId },
      create: input,
      update: { status: input.status, area: input.area, freeAt: input.freeAt },
    });
  }

  findAssignmentsByBusinessId(businessId: string, workerId?: string): Promise<WorkerAssignmentRecord[]> {
    return db.workerAssignment.findMany({
      where: { ...(workerId ? { workerId } : {}), vehicle: { businessId } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  createAssignment(input: CreateWorkerAssignmentInput): Promise<WorkerAssignmentRecord> {
    return db.workerAssignment.create({ data: input });
  }

  updateAssignmentStatus(id: string, status: string): Promise<WorkerAssignmentRecord> {
    return db.workerAssignment.update({
      where: { id },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : undefined },
    });
  }
}

export const workerPersistentStorageRepository = new WorkerPersistentStorageRepository();
