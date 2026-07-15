import { redisService } from '../../infrastructure/redis/index.js';
import type { VehicleTypeRecord } from '../../models/vehicle-type.model.js';

const TTL_SECONDS = 300;
const listKey = (businessId: string): string => `vehicle-type:${businessId}:list`;

export class VehicleTypeCacheRepository {
  async findMany(businessId: string): Promise<VehicleTypeRecord[] | null> {
    try {
      const value = await redisService.get(listKey(businessId));
      return value ? (JSON.parse(value) as VehicleTypeRecord[]) : null;
    } catch {
      return null;
    }
  }

  async saveMany(businessId: string, vehicleTypes: VehicleTypeRecord[]): Promise<void> {
    try {
      await redisService.set(listKey(businessId), JSON.stringify(vehicleTypes), TTL_SECONDS);
    } catch {}
  }

  async invalidateBusiness(businessId: string): Promise<void> {
    try {
      await redisService.delete(listKey(businessId));
    } catch {}
  }
}

export const vehicleTypeCacheRepository = new VehicleTypeCacheRepository();
