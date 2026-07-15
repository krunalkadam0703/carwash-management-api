import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { auditLogService } from '../services/audit-log.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class AuditLogController {
  list = async (req: Request, res: Response): Promise<void> => {
    const auditLogs = await auditLogService.list(this.user(req));
    ApiResponse.success(res, { auditLogs }, 'Audit logs loaded.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const auditLogController = new AuditLogController();
