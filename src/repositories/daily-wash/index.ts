import type { DailyWashRecord, UpdateDailyWashInput } from '../../models/daily-wash.model.js';
import { dailyWashPersistentStorageRepository } from './persistent-storage.js';

export class DailyWashRepository {
  findManyByBusinessId(businessId: string, date?: Date, customerId?: string): Promise<DailyWashRecord[]> {
    return dailyWashPersistentStorageRepository.findManyByBusinessId(businessId, date, customerId);
  }

  findById(businessId: string, id: string): Promise<DailyWashRecord | null> {
    return dailyWashPersistentStorageRepository.findById(businessId, id);
  }

  async generateForDate(businessId: string, date: Date): Promise<DailyWashRecord[]> {
    await dailyWashPersistentStorageRepository.generateForDate(businessId, date);
    return this.findManyByBusinessId(businessId, date);
  }

  updateStatus(input: UpdateDailyWashInput): Promise<DailyWashRecord> {
    return dailyWashPersistentStorageRepository.updateStatus(input);
  }
}

export const dailyWashRepository = new DailyWashRepository();
