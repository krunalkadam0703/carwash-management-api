import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { AppRole, AppUser, BusinessRecord } from '../../models/auth.model.js';

type UserDelegate = {
  update(args: unknown): Promise<AppUser>;
};

type BusinessDelegate = {
  findFirst(args: unknown): Promise<BusinessRecord | null>;
  create(args: unknown): Promise<BusinessRecord>;
};

type AppDb = {
  user: UserDelegate;
  business: BusinessDelegate;
  $transaction<T>(fn: (tx: AppDb) => Promise<T>): Promise<T>;
};

const db = prisma as unknown as AppDb;

export class BusinessPersistentStorageRepository {
  findByOwnerId(ownerId: string): Promise<BusinessRecord | null> {
    return db.business.findFirst({ where: { ownerId } });
  }

  findFirst(): Promise<BusinessRecord | null> {
    return db.business.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  createOwnerBusiness(input: {
    user: AppUser;
    businessName: string;
    businessDescription?: string;
    phoneNumber: string;
    address: string;
  }): Promise<{ user: AppUser; business: BusinessRecord }> {
    return db.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: input.businessName,
          description: input.businessDescription,
          ownerId: input.user.id,
        },
      });

      const user = await tx.user.update({
        where: { id: input.user.id },
        data: {
          role: 'OWNER' satisfies AppRole,
          businessId: business.id,
          phoneNumber: input.phoneNumber,
          address: input.address,
          isActive: true,
        },
      });

      return { user, business };
    });
  }
}

export const businessPersistentStorageRepository = new BusinessPersistentStorageRepository();
