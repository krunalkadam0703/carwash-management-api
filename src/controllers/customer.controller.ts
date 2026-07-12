import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { customerService } from '../services/customer.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination } from '../utils/pagination.js';

export class CustomerController {
  list = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    if (pagination) {
      const result = await customerService.listPage(this.user(req), pagination);
      ApiResponse.success(res, { customers: result.items, pagination: result.pagination }, 'Customers loaded.');
      return;
    }
    const customers = await customerService.list(this.user(req));
    ApiResponse.success(res, { customers }, 'Customers loaded.');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const customer = await customerService.update(
      this.user(req),
      customerService.text(req.params.id, 'id'),
      {
        name: customerService.optText(req.body.name),
        phoneNumber: customerService.nullableText(req.body.phoneNumber),
        address: customerService.nullableText(req.body.address),
      },
    );
    ApiResponse.success(res, { customer }, 'Customer updated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const customerController = new CustomerController();
