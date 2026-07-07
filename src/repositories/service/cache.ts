import { redisService } from '../../infrastructure/redis/index.js';
import type { ServiceRecord } from '../../models/service.model.js';

const SERVICE_CACHE_TTL_SECONDS = 300;
const serviceCacheKey = (businessId: string, id: string): string => `service:${businessId}:${id}`;
const serviceListCacheKey = (businessId: string): string => `service:${businessId}:list`;

export class ServiceCacheRepository {
  async findById(businessId: string, id: string): Promise<ServiceRecord | null> {
    try {
      const value = await redisService.get(serviceCacheKey(businessId, id));
      return value ? (JSON.parse(value) as ServiceRecord) : null;
    } catch {
      return null;
    }
  }

  async findManyByBusinessId(businessId: string): Promise<ServiceRecord[] | null> {
    try {
      const value = await redisService.get(serviceListCacheKey(businessId));
      return value ? (JSON.parse(value) as ServiceRecord[]) : null;
    } catch {
      return null;
    }
  }

  async save(service: ServiceRecord): Promise<void> {
    try {
      await redisService.set(
        serviceCacheKey(service.businessId, service.id),
        JSON.stringify(service),
        SERVICE_CACHE_TTL_SECONDS,
      );
    } catch {
      // Cache failures must not block database flow.
    }
  }

  async saveMany(businessId: string, services: ServiceRecord[]): Promise<void> {
    try {
      await redisService.set(
        serviceListCacheKey(businessId),
        JSON.stringify(services),
        SERVICE_CACHE_TTL_SECONDS,
      );
    } catch {
      // Cache failures must not block database flow.
    }
  }

  async invalidateBusiness(businessId: string): Promise<void> {
    try {
      await redisService.delete(serviceListCacheKey(businessId));
    } catch {
      // Cache failures must not block database flow.
    }
  }
}

export const serviceCacheRepository = new ServiceCacheRepository();
