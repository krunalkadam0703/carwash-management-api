import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { complaintService } from '../services/complaint.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination } from '../utils/pagination.js';

export class ComplaintController {
  list = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    if (pagination) {
      const result = await complaintService.listPage(this.user(req), pagination);
      ApiResponse.success(
        res,
        { complaints: result.items, pagination: result.pagination },
        'Complaints loaded.',
      );
      return;
    }
    const complaints = await complaintService.list(this.user(req));
    ApiResponse.success(res, { complaints }, 'Complaints loaded.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const complaint = await complaintService.create(this.user(req), {
      subject: complaintService.text(req.body.subject, 'subject'),
      message: complaintService.text(req.body.message, 'message'),
      dailyWashId: complaintService.text(req.body.dailyWashId, 'dailyWashId'),
    });

    ApiResponse.success(res, { complaint }, 'Complaint created.', HttpStatus.CREATED);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const complaint = await complaintService.updateStatus(
      this.user(req),
      complaintService.text(req.params.id, 'id'),
      complaintService.status(req.body.status),
      complaintService.optText(req.body.conclusion),
    );

    ApiResponse.success(res, { complaint }, 'Complaint updated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const complaintController = new ComplaintController();
