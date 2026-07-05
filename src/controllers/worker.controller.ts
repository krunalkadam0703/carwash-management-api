import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { workerService } from '../services/worker.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class WorkerController {
  listStatuses = async (req: Request, res: Response): Promise<void> => {
    const statuses = await workerService.listStatuses(this.user(req));
    ApiResponse.success(res, { statuses }, 'Worker statuses loaded.');
  };

  updateMyStatus = async (req: Request, res: Response): Promise<void> => {
    const status = await workerService.updateMyStatus(this.user(req), {
      status: workerService.liveStatus(req.body.status),
      area: workerService.optText(req.body.area),
      freeAt: workerService.optDate(req.body.freeAt),
    });
    ApiResponse.success(res, { status }, 'Worker status updated.');
  };

  listAssignments = async (req: Request, res: Response): Promise<void> => {
    const assignments = await workerService.listAssignments(this.user(req));
    ApiResponse.success(res, { assignments }, 'Worker assignments loaded.');
  };

  assignVehicle = async (req: Request, res: Response): Promise<void> => {
    const assignment = await workerService.assignVehicle(
      this.user(req),
      workerService.text(req.body.workerId, 'workerId'),
      workerService.text(req.body.vehicleId, 'vehicleId'),
    );
    ApiResponse.success(res, { assignment }, 'Vehicle assigned.', HttpStatus.CREATED);
  };

  updateAssignment = async (req: Request, res: Response): Promise<void> => {
    const assignment = await workerService.updateAssignment(
      this.user(req),
      workerService.text(req.params.id, 'id'),
      workerService.assignmentStatus(req.body.status),
    );
    ApiResponse.success(res, { assignment }, 'Worker assignment updated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const workerController = new WorkerController();
