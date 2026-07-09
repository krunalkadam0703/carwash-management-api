import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type {
  AssignmentStatus,
  WorkerAssignmentRecord,
  WorkerLiveStatus,
  WorkerStatusRecord,
} from '../models/worker.model.js';
import { workerRepository } from '../repositories/worker/index.js';
import { auditLogService } from './audit-log.service.js';
import { AppError } from '../utils/app-error.js';

const LIVE_STATUSES: WorkerLiveStatus[] = ['OFFLINE', 'AVAILABLE', 'BUSY', 'ON_BREAK'];
const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export class WorkerService {
  async listStatuses(user: AppUser): Promise<WorkerStatusRecord[]> {
    const statuses = await workerRepository.findStatusesByBusinessId(this.requireBusinessId(user));
    if (user.role === 'WORKER') return statuses.filter((status) => status.workerId === user.id);
    this.requireOwner(user);
    return statuses;
  }

  async updateMyStatus(
    user: AppUser,
    input: { status: WorkerLiveStatus; area?: string; freeAt?: Date },
  ): Promise<WorkerStatusRecord> {
    if (user.role !== 'WORKER')
      throw new AppError('Only workers can update their live status.', HttpStatus.FORBIDDEN);
    const status = await workerRepository.upsertStatus({
      workerId: user.id,
      businessId: this.requireBusinessId(user),
      ...input,
    });
    await auditLogService.create({
      businessId: status.businessId,
      userId: user.id,
      action: 'UPDATE_WORKER_STATUS',
      entityType: 'WorkerStatus',
      entityId: user.id,
      newData: { status: status.status, area: status.area },
    });
    return status;
  }

  async listAssignments(user: AppUser): Promise<WorkerAssignmentRecord[]> {
    const businessId = this.requireBusinessId(user);
    return workerRepository.findAssignmentsByBusinessId(
      businessId,
      user.role === 'WORKER' ? user.id : undefined,
    );
  }

  async assignVehicle(
    user: AppUser,
    workerId: string,
    vehicleId: string,
  ): Promise<WorkerAssignmentRecord> {
    this.requireOwner(user);
    const businessId = this.requireBusinessId(user);
    if (!(await workerRepository.existsWorkerForBusiness(businessId, workerId)))
      throw new AppError('Worker was not found.', HttpStatus.NOT_FOUND);
    if (!(await workerRepository.existsVehicleForBusiness(businessId, vehicleId)))
      throw new AppError('Vehicle was not found.', HttpStatus.NOT_FOUND);
    const assignment = await workerRepository.assignVehicle(businessId, {
      assignedById: user.id,
      workerId,
      vehicleId,
    });
    await auditLogService.create({
      businessId,
      userId: user.id,
      action: 'ASSIGN_VEHICLE',
      entityType: 'WorkerAssignment',
      entityId: assignment.id,
      newData: { workerId, vehicleId },
    });
    return assignment;
  }

  async updateAssignment(
    user: AppUser,
    id: string,
    status: AssignmentStatus,
  ): Promise<WorkerAssignmentRecord> {
    if (!['OWNER', 'WORKER'].includes(user.role))
      throw new AppError('Only owners or workers can update assignments.', HttpStatus.FORBIDDEN);
    const assignment = await workerRepository.updateAssignmentStatus(id, status);
    await auditLogService.create({
      businessId: user.businessId ?? undefined,
      userId: user.id,
      action: 'UPDATE_ASSIGNMENT_STATUS',
      entityType: 'WorkerAssignment',
      entityId: assignment.id,
      newData: { status: assignment.status },
    });
    return assignment;
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
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  optDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
      throw new AppError('freeAt must be valid.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  private requireOwner(user: AppUser): void {
    if (user.role !== 'OWNER')
      throw new AppError('Only owners can manage workers.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const workerService = new WorkerService();
