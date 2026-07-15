import './cache.js';
import { accountPersistentStorageRepository } from './persistent-storage.js';

export class AccountRepository {
  hasGoogleAccount(userId: string): Promise<boolean> {
    return accountPersistentStorageRepository.hasGoogleAccount(userId);
  }
}

export const accountRepository = new AccountRepository();
