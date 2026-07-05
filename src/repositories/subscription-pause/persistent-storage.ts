import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { CreateSubscriptionPauseInput, PauseSubscriptionRecord, SubscriptionPauseRecord } from '../../models/subscription-pause.model.js';

type PauseDelegate = {
  findMany(args: unknown): Promise<SubscriptionPauseRecord[]>;
  create(args: unknown): Promise<SubscriptionPauseRecord>;
};
type SubscriptionDelegate = {
  findFirst(args: unknown): Promise<PauseSubscriptionRecord | null>;
};
type AppDb = {
  subscriptionPause: PauseDelegate;
  vehicleSubscription: SubscriptionDelegate;
};

const db = prisma as unknown as AppDb;

export class SubscriptionPausePersistentStorageRepository {
  findManyByBusinessId(businessId: string, customerId?: string): Promise<SubscriptionPauseRecord[]> {
    return db.subscriptionPause.findMany({
      where: { businessId, ...(customerId ? { customerId } : {}) },
      orderBy: { startDate: 'desc' },
    });
  }

  findSubscription(businessId: string, subscriptionId: string): Promise<PauseSubscriptionRecord | null> {
    return db.vehicleSubscription.findFirst({
      where: { id: subscriptionId, businessId },
      select: { id: true, businessId: true, customerId: true, status: true },
    });
  }

  create(input: CreateSubscriptionPauseInput): Promise<SubscriptionPauseRecord> {
    return db.subscriptionPause.create({ data: input });
  }
}

export const subscriptionPausePersistentStorageRepository = new SubscriptionPausePersistentStorageRepository();
