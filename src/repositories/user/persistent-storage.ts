import { randomUUID } from 'crypto';

import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { AppRole, AppUser } from '../../models/auth.model.js';
import type { PaginationInput, PaginatedResult } from '../../utils/pagination.js';
import { paginated, skip } from '../../utils/pagination.js';

type UserDelegate = {
  findUnique(args: unknown): Promise<AppUser | null>;
  findMany(args: unknown): Promise<AppUser[]>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<AppUser>;
  update(args: unknown): Promise<AppUser>;
};

type AppDb = {
  user: UserDelegate;
};

const db = prisma as unknown as AppDb;

export class UserPersistentStorageRepository {
  findById(id: string): Promise<AppUser | null> {
    return db.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<AppUser | null> {
    return db.user.findUnique({ where: { email } });
  }

  findManyByBusinessAndRole(businessId: string, role: AppRole): Promise<AppUser[]> {
    return db.user.findMany({ where: { businessId, role }, orderBy: { createdAt: 'desc' } });
  }

  async findPageByBusinessAndRole(
    businessId: string,
    role: AppRole,
    input: PaginationInput,
  ): Promise<PaginatedResult<AppUser>> {
    const where = {
      businessId,
      role,
      ...(input.status === 'active' ? { isActive: true } : {}),
      ...(input.status === 'inactive' ? { isActive: false } : {}),
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: 'insensitive' } },
              { email: { contains: input.search, mode: 'insensitive' } },
              { phoneNumber: { contains: input.search } },
              { address: { contains: input.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: skip(input),
        take: input.pageSize,
      }),
    ]);
    return paginated(rows, total, input);
  }

  createInactiveWorker(input: {
    businessId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
  }): Promise<AppUser> {
    return db.user.create({
      data: {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        emailVerified: false,
        role: 'WORKER' satisfies AppRole,
        businessId: input.businessId,
        phoneNumber: input.phoneNumber,
        address: input.address,
        isActive: false,
      },
    });
  }

  activateWorker(userId: string): Promise<AppUser> {
    return db.user.update({
      where: { id: userId },
      data: { isActive: true, emailVerified: true },
    });
  }

  updateCustomerProfile(input: {
    userId: string;
    phoneNumber: string;
    address: string;
    businessId?: string;
  }): Promise<AppUser> {
    return db.user.update({
      where: { id: input.userId },
      data: {
        phoneNumber: input.phoneNumber,
        address: input.address,
        businessId: input.businessId,
        isActive: true,
      },
    });
  }

  updateProfile(input: {
    userId: string;
    name?: string;
    phoneNumber?: string | null;
    address?: string | null;
  }): Promise<AppUser> {
    return db.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        phoneNumber: input.phoneNumber,
        address: input.address,
      },
    });
  }
}

export const userPersistentStorageRepository = new UserPersistentStorageRepository();
