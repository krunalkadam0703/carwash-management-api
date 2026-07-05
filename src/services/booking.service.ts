import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { BookingRecord, BookingStatus } from '../models/booking.model.js';
import { bookingRepository } from '../repositories/booking/index.js';
import { AppError } from '../utils/app-error.js';

export class BookingService {
  async list(user: AppUser): Promise<BookingRecord[]> {
    const businessId = this.requireBusinessId(user);
    return bookingRepository.findManyByBusinessId(businessId, user.role === 'CUSTOMER' ? user.id : undefined);
  }

  async create(user: AppUser, input: { customerId?: string; vehicleId: string; serviceId?: string; scheduledDate: string; address?: string; notes?: string }): Promise<BookingRecord> {
    const businessId = this.requireBusinessId(user);
    const customerId = user.role === 'CUSTOMER' ? user.id : this.text(input.customerId, 'customerId');
    const vehicle = await bookingRepository.findVehicle(businessId, input.vehicleId);
    if (!vehicle || vehicle.customerId !== customerId) throw new AppError('Vehicle was not found for this customer.', HttpStatus.NOT_FOUND);
    const service = input.serviceId ? await bookingRepository.findService(businessId, input.serviceId) : null;
    if (input.serviceId && !service) throw new AppError('Service was not found.', HttpStatus.NOT_FOUND);

    return bookingRepository.create({
      businessId,
      customerId,
      vehicleId: input.vehicleId,
      serviceId: input.serviceId,
      scheduledDate: this.date(input.scheduledDate, 'scheduledDate'),
      amount: service ? Number(service.basePrice.toString()) : 0,
      address: this.optText(input.address),
      notes: this.optText(input.notes),
    });
  }

  async assign(user: AppUser, id: string, workerId: string): Promise<BookingRecord> {
    this.requireOwner(user);
    await this.requireBooking(user, id);
    return bookingRepository.updateStatus({ id, businessId: this.requireBusinessId(user), status: 'ASSIGNED', workerId });
  }

  async start(user: AppUser, id: string): Promise<BookingRecord> {
    const booking = await this.requireBooking(user, id);
    if (user.role === 'WORKER' && booking.workerId !== user.id) throw new AppError('Booking was not assigned to you.', HttpStatus.FORBIDDEN);
    return bookingRepository.updateStatus({ id, businessId: booking.businessId, status: 'IN_PROGRESS' });
  }

  async complete(user: AppUser, id: string): Promise<BookingRecord> {
    const booking = await this.requireBooking(user, id);
    if (user.role === 'WORKER' && booking.workerId !== user.id) throw new AppError('Booking was not assigned to you.', HttpStatus.FORBIDDEN);
    return bookingRepository.updateStatus({ id, businessId: booking.businessId, status: 'COMPLETED' });
  }

  async cancel(user: AppUser, id: string, reason?: string): Promise<BookingRecord> {
    const booking = await this.requireBooking(user, id);
    return bookingRepository.updateStatus({ id, businessId: booking.businessId, status: 'CANCELLED', skipReason: this.optText(reason) });
  }

  async rate(user: AppUser, id: string, rating: number, ratingComment?: string): Promise<BookingRecord> {
    const booking = await this.requireBooking(user, id);
    if (user.role !== 'CUSTOMER' || booking.customerId !== user.id) throw new AppError('Only the customer can rate this booking.', HttpStatus.FORBIDDEN);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError('rating must be between 1 and 5.', HttpStatus.BAD_REQUEST);
    return bookingRepository.rate(id, rating, this.optText(ratingComment));
  }

  status(value: unknown): BookingStatus {
    const status = this.text(value, 'status').toUpperCase() as BookingStatus;
    if (!['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SKIPPED'].includes(status)) throw new AppError('Invalid booking status.', HttpStatus.BAD_REQUEST);
    return status;
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  int(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new AppError(field + ' must be an integer.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  private async requireBooking(user: AppUser, id: string): Promise<BookingRecord> {
    const booking = await bookingRepository.findById(this.requireBusinessId(user), id);
    if (!booking || (user.role === 'CUSTOMER' && booking.customerId !== user.id)) throw new AppError('Booking was not found.', HttpStatus.NOT_FOUND);
    return booking;
  }

  private date(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new AppError(field + ' must be a valid date.', HttpStatus.BAD_REQUEST);
    return date;
  }

  private requireOwner(user: AppUser): void {
    if (!['OWNER', 'SYSTEM_ADMIN'].includes(user.role)) throw new AppError('Only owners can perform this action.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const bookingService = new BookingService();
