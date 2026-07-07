import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  AttachRazorpayOrderInput,
  CompletePaymentInput,
  CreateSubscriptionPaymentInput,
  FailPaymentInput,
  PaymentRecord,
} from '../../models/payment.model.js';

type PrismaPayment = Omit<PaymentRecord, 'amount'> & { amount: { toString(): string } };
type SubscriptionForPayment = {
  id: string;
  businessId: string;
  customerId: string;
  status: string;
  amount: { toString(): string };
  plan: { durationDays: number };
};
type PaymentDelegate = {
  findMany(args: unknown): Promise<PrismaPayment[]>;
  findFirst(args: unknown): Promise<PrismaPayment | null>;
  create(args: unknown): Promise<PrismaPayment>;
  update(args: unknown): Promise<PrismaPayment>;
};
type SubscriptionDelegate = {
  findFirst(args: unknown): Promise<SubscriptionForPayment | null>;
  update(args: unknown): Promise<unknown>;
};
type AppDb = {
  payment: PaymentDelegate;
  vehicleSubscription: SubscriptionDelegate;
  $transaction<T>(fn: (tx: AppDb) => Promise<T>): Promise<T>;
};

const db = prisma as unknown as AppDb;
const mapPayment = (row: PrismaPayment): PaymentRecord => ({
  ...row,
  amount: row.amount.toString(),
});

export class PaymentPersistentStorageRepository {
  async findManyByBusinessId(
    businessId: string,
    customerId?: string,
    subscriptionId?: string,
  ): Promise<PaymentRecord[]> {
    const rows = await db.payment.findMany({
      where: {
        businessId,
        ...(customerId ? { customerId } : {}),
        ...(subscriptionId ? { subscriptionId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapPayment);
  }

  async findById(businessId: string, id: string): Promise<PaymentRecord | null> {
    const row = await db.payment.findFirst({ where: { id, businessId } });
    return row ? mapPayment(row) : null;
  }

  findSubscription(
    businessId: string,
    subscriptionId: string,
  ): Promise<SubscriptionForPayment | null> {
    return db.vehicleSubscription.findFirst({
      where: { id: subscriptionId, businessId },
      include: { plan: { select: { durationDays: true } } },
    });
  }

  async createSubscriptionPayment(input: CreateSubscriptionPaymentInput): Promise<PaymentRecord> {
    return db.$transaction(async (tx) => {
      const row = await tx.payment.create({
        data: { ...input, status: 'PENDING', currency: 'INR' },
      });
      await tx.vehicleSubscription.update({
        where: { id: input.subscriptionId },
        data: { status: 'PAYMENT_PENDING' },
      });
      return mapPayment(row);
    });
  }

  async attachRazorpayOrder(input: AttachRazorpayOrderInput): Promise<PaymentRecord> {
    const row = await db.payment.update({
      where: { id: input.id },
      data: { razorpayOrderId: input.razorpayOrderId },
    });
    return mapPayment(row);
  }

  async complete(input: CompletePaymentInput): Promise<PaymentRecord> {
    return db.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: input.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          razorpayPaymentId: input.razorpayPaymentId,
          razorpaySignature: input.razorpaySignature,
          paymentMethod: input.paymentMethod,
          upiRef: input.upiRef,
        },
      });
      if (payment.subscriptionId)
        await tx.vehicleSubscription.update({
          where: { id: payment.subscriptionId },
          data: { status: 'PAYMENT_COMPLETED' },
        });
      return mapPayment(payment);
    });
  }

  async fail(input: FailPaymentInput): Promise<PaymentRecord> {
    const row = await db.payment.update({
      where: { id: input.id },
      data: { status: 'FAILED', failureReason: input.failureReason },
    });
    return mapPayment(row);
  }
}

export const paymentPersistentStorageRepository = new PaymentPersistentStorageRepository();
