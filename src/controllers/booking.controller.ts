import { Request, Response } from 'express';

import { HttpStatus } from '../constants/http.js';
import type { AuthenticatedUser } from '../models/auth.model.js';
import { bookingService } from '../services/booking.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export class BookingController {
  list = async (req: Request, res: Response): Promise<void> => {
    const bookings = await bookingService.list(this.user(req));
    ApiResponse.success(res, { bookings }, 'Bookings loaded.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.create(this.user(req), {
      customerId: bookingService.optText(req.body.customerId),
      vehicleId: bookingService.text(req.body.vehicleId, 'vehicleId'),
      serviceId: bookingService.optText(req.body.serviceId),
      scheduledDate: bookingService.text(req.body.scheduledDate, 'scheduledDate'),
      address: bookingService.optText(req.body.address),
      notes: bookingService.optText(req.body.notes),
    });
    ApiResponse.success(res, { booking }, 'Booking created.', HttpStatus.CREATED);
  };

  assign = async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.assign(
      this.user(req),
      bookingService.text(req.params.id, 'id'),
      bookingService.text(req.body.workerId, 'workerId'),
    );
    ApiResponse.success(res, { booking }, 'Booking assigned.');
  };

  start = async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.start(
      this.user(req),
      bookingService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { booking }, 'Booking started.');
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.complete(
      this.user(req),
      bookingService.text(req.params.id, 'id'),
    );
    ApiResponse.success(res, { booking }, 'Booking completed.');
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.cancel(
      this.user(req),
      bookingService.text(req.params.id, 'id'),
      bookingService.optText(req.body.reason),
    );
    ApiResponse.success(res, { booking }, 'Booking cancelled.');
  };

  rate = async (req: Request, res: Response): Promise<void> => {
    const booking = await bookingService.rate(
      this.user(req),
      bookingService.text(req.params.id, 'id'),
      bookingService.int(req.body.rating, 'rating'),
      bookingService.optText(req.body.ratingComment),
    );
    ApiResponse.success(res, { booking }, 'Booking rated.');
  };

  private user(req: Request): AuthenticatedUser {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) throw new AppError('Authentication is required.', HttpStatus.UNAUTHORIZED);
    return user;
  }
}

export const bookingController = new BookingController();
