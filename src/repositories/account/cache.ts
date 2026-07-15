export class AccountCacheRepository {
  // Account lookups are security-sensitive and provider tokens can rotate.
  // Keep this file for repository consistency, but read account state from persistent storage.
}

export const accountCacheRepository = new AccountCacheRepository();
