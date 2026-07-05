import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { AssignmentStatus, WorkerAssignmentRecord, WorkerLiveStatus, WorkerStatusRecord } from '../models/worker.model.js';
import { workerRepository } from '../repositories/worker/index.js';
import { AppError } from '../utils/app-error.js';

const LIVE_STATUSES: WorkerLiveStatus[] = ['OFFLINE', 'AVAILABLE', 'BUSY', 'ON_BREAK'];
const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export class WorkerService {
  async listStatuses(user: AppUser): Promise<WorkerStatusRecord[]> {
    this.requireOwner(user);
    return workerRepository.findStatusesByBusinessId(this.requireBusinessId(user));
  }

  async updateMyStatus(user: AppUser, input: { status: WorkerLiveStatus; area?: string; freeAt?: Date }): Promise<WorkerStatusRecord> {
    if (user.role !== 'WORKER') throw new AppError('Only workers can update their live status.', HttpStatus.FORBIDDEN);
    return workerRepository.upsertStatus({ workerId: user.id, businessId: this.requireBusinessId(user), ...input });
  }

  async listAssignments(user: AppUser): Promise<WorkerAssignmentRecord[]> {
    const businessId = this.requireBusinessId(user);
    return workerRepository.findAssignmentsByBusinessId(businessId, user.role === 'WORKER' ? user.id : undefined);
  }

  async assignVehicle(user: AppUser, workerId: string, vehicleId: string): Promise<WorkerAssignmentRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    if (!(await workerRepository.existsWorkerForBusiness(businessId, workerId))) throw new AppError('Worker was not found.', HttpStatus.NOT_FOUND);
    if (!(await workerRepository.existsVehicleForBusiness(businessId, vehicleId))) throw new AppError('Vehicle was not found.', HttpStatus.NOT_FOUND);
    await workerRepository.upsertStatus({ workerId, businessId, status: 'BUSY' });
    return workerRepository.createAssignment({ assignedById: user.id, workerId, vehicleId });
  }

  async updateAssignment(user: AppUser, id: string, status: AssignmentStatus): Promise<WorkerAssignmentRecord> {
    if (!['OWNER', 'WORKER'].includes(user.role)) throw new AppError('Only owners or workers can update assignments.', HttpStatus.FORBIDDEN);
    return workerRepository.updateAssignmentStatus(id, status);
  }

  liveStatus(value: unknown): WorkerLiveStatus {
    if (typeof value !== 'string' || !LIVE_STATUSES.includes(value as WorkerLiveStatus)) {
      throw new AppError('status is invalid.', HttpStatus.BAD_REQUEST);
    }
    return value as WorkerLiveStatus;
  }

  assignmentStatus(value: unknown): AssignmentStatus {
    if (typeof value !== 'string' || !ASSIGNMENT_STATUSES.includes(value as AssignmentStatus)) {
      throw new AppError('status is invalid.', HttpStatus.BAD_REQUEST);
    }
    return value as AssignmentStatus;
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  optDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new AppError('freeAt must be valid.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER') throw new AppError('Only owners can manage workers.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const workerService = new WorkerService();
