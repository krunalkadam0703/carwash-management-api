import type {
  CreateWorkerAssignmentInput,
  UpdateWorkerStatusInput,
  WorkerAssignmentRecord,
  WorkerStatusRecord,
} from '../../models/worker.model.js';
import { workerPersistentStorageRepository } from './persistent-storage.js';

export class WorkerRepository {
  findStatusesByBusinessId(businessId: string): Promise<WorkerStatusRecord[]> {
    return workerPersistentStorageRepository.findStatusesByBusinessId(businessId);
  }

  existsWorkerForBusiness(businessId: string, workerId: string): Promise<boolean> {
    return workerPersistentStorageRepository.existsWorkerForBusiness(businessId, workerId);
  }

  existsVehicleForBusiness(businessId: string, vehicleId: string): Promise<boolean> {
    return workerPersistentStorageRepository.existsVehicleForBusiness(businessId, vehicleId);
  }

  upsertStatus(input: UpdateWorkerStatusInput): Promise<WorkerStatusRecord> {
    return workerPersistentStorageRepository.upsertStatus(input);
  }

  findAssignmentsByBusinessId(
    businessId: string,
    workerId?: string,
    customerId?: string,
  ): Promise<WorkerAssignmentRecord[]> {
    return workerPersistentStorageRepository.findAssignmentsByBusinessId(
      businessId,
      workerId,
      customerId,
    );
  }

  createAssignment(input: CreateWorkerAssignmentInput): Promise<WorkerAssignmentRecord> {
    return workerPersistentStorageRepository.createAssignment(input);
  }

  assignVehicle(
    businessId: string,
    input: CreateWorkerAssignmentInput,
  ): Promise<WorkerAssignmentRecord> {
    return workerPersistentStorageRepository.assignVehicle(businessId, input);
  }

  updateAssignmentStatus(id: string, status: string): Promise<WorkerAssignmentRecord> {
    return workerPersistentStorageRepository.updateAssignmentStatus(id, status);
  }
}

export const workerRepository = new WorkerRepository();
