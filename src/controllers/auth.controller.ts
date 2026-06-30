import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { authService, type AuthServiceContract } from '../services/auth.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class AuthController {
  constructor(private readonly authService: AuthServiceContract) {}

  me = (req: Request, res: Response): void => {
    ApiResponse.success(res, { user: this.getSessionUser(req) }, 'Authenticated profile loaded.');
  };

  onboardOwner = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.onboardOwner({
      user: this.getSessionUser(req),
      businessName: this.authService.requireText(req.body.businessName, 'businessName'),
      businessDescription: this.authService.optionalText(req.body.businessDescription),
      phoneNumber: this.authService.requireText(req.body.phoneNumber, 'phoneNumber'),
      address: this.authService.requireText(req.body.address, 'address'),
    });

    ApiResponse.success(res, result, 'Owner business account created.', HttpStatus.CREATED);
  };

  onboardCustomer = async (req: Request, res: Response): Promise<void> => {
    const updatedUser = await this.authService.onboardCustomer({
      user: this.getSessionUser(req),
      phoneNumber: this.authService.requireText(req.body.phoneNumber, 'phoneNumber'),
      address: this.authService.requireText(req.body.address, 'address'),
    });

    ApiResponse.success(res, { user: updatedUser }, 'Customer account completed.');
  };

  createWorker = async (req: Request, res: Response): Promise<void> => {
    const worker = await this.authService.createInvitedWorker({
      owner: this.getSessionUser(req),
      name: this.authService.requireText(req.body.name, 'name'),
      email: this.authService.requireText(req.body.email, 'email'),
      phoneNumber: this.authService.optionalText(req.body.phoneNumber),
      address: this.authService.optionalText(req.body.address),
    });

    ApiResponse.success(res, { worker }, 'Worker account invited and deactivated.', HttpStatus.CREATED);
  };

  private getSessionUser(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;

    if (!user) {
      throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}

export const authController = new AuthController(authService);
