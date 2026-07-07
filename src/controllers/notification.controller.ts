import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class NotificationController {
  list = async (req: Request, res: Response): Promise<void> => {
    const notifications = await notificationService.list(this.user(req));
    ApiResponse.success(res, { notifications }, 'Notifications loaded.');
  };

  unreadCount = async (req: Request, res: Response): Promise<void> => {
    const unreadCount = await notificationService.unreadCount(this.user(req));
    ApiResponse.success(res, { unreadCount }, 'Unread notification count loaded.');
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const notification = await notificationService.markRead(
      this.user(req),
      notificationService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { notification }, 'Notification marked read.');
  };

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    await notificationService.markAllRead(this.user(req));
    ApiResponse.success(res, {}, 'Notifications marked read.');
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    const notification = await notificationService.archive(
      this.user(req),
      notificationService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { notification }, 'Notification archived.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const notificationController = new NotificationController();
