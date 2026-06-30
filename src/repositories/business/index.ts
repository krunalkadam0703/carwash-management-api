import type { AppUser, BusinessRecord } from '../../models/auth.model.js';
import { userCacheRepository } from '../user/cache.js';
import { businessCacheRepository } from './cache.js';
import { businessPersistentStorageRepository } from './persistent-storage.js';

export class BusinessRepository {
  async findByOwnerId(ownerId: string): Promise<BusinessRecord | null> {
    const cachedBusiness = await businessCacheRepository.findByOwnerId(ownerId);

    if (cachedBusiness) {
      return cachedBusiness;
    }

    const business = await businessPersistentStorageRepository.findByOwnerId(ownerId);

    if (business) {
      await businessCacheRepository.saveByOwnerId(ownerId, business);
    }

    return business;
  }

  async createOwnerBusiness(input: {
    user: AppUser;
    businessName: string;
    businessDescription?: string;
    phoneNumber: string;
    address: string;
  }): Promise<{ user: AppUser; business: BusinessRecord }> {
    const result = await businessPersistentStorageRepository.createOwnerBusiness(input);

    await Promise.all([
      businessCacheRepository.saveByOwnerId(result.user.id, result.business),
      userCacheRepository.save(result.user),
    ]);

    return result;
  }
}

export const businessRepository = new BusinessRepository();
