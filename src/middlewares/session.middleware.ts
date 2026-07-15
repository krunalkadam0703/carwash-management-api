import { fromNodeHeaders } from 'better-auth/node';
import { NextFunction, Request, Response } from 'express';

import { auth } from '../config/auth.config.js';
import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export async function requireSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user?: { id?: string } } | null;

    if (!session?.user?.id) {
      throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    }

    (req as AuthenticatedRequest).user = await authService.getAuthenticatedUser(session.user.id);
    next();
  } catch (error) {
    next(error);
  }
}
