import type { AppUser } from '../../models/auth.model.js';
import { userCacheRepository } from './cache.js';
import { userPersistentStorageRepository } from './persistent-storage.js';

export class UserRepository {
  async findById(id: string): Promise<AppUser | null> {
    const cachedUser = await userCacheRepository.findById(id);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await userPersistentStorageRepository.findById(id);

    if (user) {
      await userCacheRepository.save(user);
    }

    return user;
  }

  findByEmail(email: string): Promise<AppUser | null> {
    return userPersistentStorageRepository.findByEmail(email);
  }

  async createInactiveWorker(input: {
    businessId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
  }): Promise<AppUser> {
    const worker = await userPersistentStorageRepository.createInactiveWorker(input);
    await userCacheRepository.save(worker);
    return worker;
  }

  async activateWorker(userId: string): Promise<AppUser> {
    const user = await userPersistentStorageRepository.activateWorker(userId);
    await userCacheRepository.save(user);
    return user;
  }

  async updateCustomerProfile(input: {
    userId: string;
    phoneNumber: string;
    address: string;
  }): Promise<AppUser> {
    const user = await userPersistentStorageRepository.updateCustomerProfile(input);
    await userCacheRepository.save(user);
    return user;
  }
}

export const userRepository = new UserRepository();
