import { prisma } from '../../infrastructure/prisma/prisma.client.js';

type AccountDelegate = {
  findFirst(args: unknown): Promise<unknown | null>;
};

type AppDb = {
  account: AccountDelegate;
};

const db = prisma as unknown as AppDb;

export class AccountPersistentStorageRepository {
  async hasGoogleAccount(userId: string): Promise<boolean> {
    const googleAccount = await db.account.findFirst({
      where: {
        userId,
        providerId: 'google',
      },
    });

    return Boolean(googleAccount);
  }
}

export const accountPersistentStorageRepository = new AccountPersistentStorageRepository();
