import { redisService } from '../../infrastructure/redis/index.js';
import type { VehicleRecord } from '../../models/vehicle.model.js';

const TTL_SECONDS = 300;
const ownerListKey = (businessId: string): string => `vehicle:${businessId}:list`;
const customerListKey = (businessId: string, customerId: string): string => `vehicle:${businessId}:customer:${customerId}`;

export class VehicleCacheRepository {
  async findMany(businessId: string, customerId?: string): Promise<VehicleRecord[] | null> {
    try {
      const value = await redisService.get(customerId ? customerListKey(businessId, customerId) : ownerListKey(businessId));
      return value ? (JSON.parse(value) as VehicleRecord[]) : null;
    } catch {
      return null;
    }
  }

  async saveMany(businessId: string, vehicles: VehicleRecord[], customerId?: string): Promise<void> {
    try {
      await redisService.set(customerId ? customerListKey(businessId, customerId) : ownerListKey(businessId), JSON.stringify(vehicles), TTL_SECONDS);
    } catch {}
  }

  async invalidateBusiness(businessId: string, customerId?: string): Promise<void> {
    try {
      await redisService.delete(ownerListKey(businessId));
      if (customerId) await redisService.delete(customerListKey(businessId, customerId));
    } catch {}
  }
}

export const vehicleCacheRepository = new VehicleCacheRepository();
