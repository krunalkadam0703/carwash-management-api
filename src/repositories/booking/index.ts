import type { BookingRecord, CreateBookingInput, UpdateBookingStatusInput } from '../../models/booking.model.js';
import { bookingPersistentStorageRepository } from './persistent-storage.js';

export class BookingRepository {
  findManyByBusinessId(businessId: string, customerId?: string): Promise<BookingRecord[]> {
    return bookingPersistentStorageRepository.findManyByBusinessId(businessId, customerId);
  }

  findById(businessId: string, id: string): Promise<BookingRecord | null> {
    return bookingPersistentStorageRepository.findById(businessId, id);
  }

  findVehicle(businessId: string, id: string) {
    return bookingPersistentStorageRepository.findVehicle(businessId, id);
  }

  findService(businessId: string, id: string) {
    return bookingPersistentStorageRepository.findService(businessId, id);
  }

  create(input: CreateBookingInput): Promise<BookingRecord> {
    return bookingPersistentStorageRepository.create(input);
  }

  updateStatus(input: UpdateBookingStatusInput): Promise<BookingRecord> {
    return bookingPersistentStorageRepository.updateStatus(input);
  }

  rate(id: string, rating: number, ratingComment?: string): Promise<BookingRecord> {
    return bookingPersistentStorageRepository.rate(id, rating, ratingComment);
  }
}

export const bookingRepository = new BookingRepository();
