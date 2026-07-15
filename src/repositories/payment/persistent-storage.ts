import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  AttachRazorpayOrderInput,
  CompletePaymentInput,
  CompleteWebhookPaymentInput,
  CreateSubscriptionPaymentInput,
  FailPaymentInput,
  FailWebhookPaymentInput,
  PaymentRecord,
} from '../../models/payment.model.js';
import type { PaginationInput, PaginatedResult } from '../../utils/pagination.js';
import { paginated, skip } from '../../utils/pagination.js';

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
  count(args: unknown): Promise<number>;
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
const webhookPaymentWhere = (input: {
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}) => ({
  OR: [
    ...(input.paymentId ? [{ id: input.paymentId }] : []),
    ...(input.razorpayOrderId ? [{ razorpayOrderId: input.razorpayOrderId }] : []),
    ...(input.razorpayPaymentId ? [{ razorpayPaymentId: input.razorpayPaymentId }] : []),
  ],
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

  async findPageByBusinessId(
    businessId: string,
    input: PaginationInput,
    customerId?: string,
    subscriptionId?: string,
  ): Promise<PaginatedResult<PaymentRecord>> {
    const where = {
      businessId,
      ...(customerId ? { customerId } : {}),
      ...(subscriptionId ? { subscriptionId } : {}),
      ...(input.status && input.status !== 'all' ? { status: input.status } : {}),
      ...(input.method && input.method !== 'all'
        ? input.method === 'subscription'
          ? { OR: [{ paymentMethod: 'subscription' }, { paymentMethod: null }] }
          : { paymentMethod: input.method }
        : {}),
      ...(input.search
        ? {
            OR: [
              { id: { contains: input.search } },
              { receiptId: { contains: input.search } },
              { razorpayOrderId: { contains: input.search } },
              { razorpayPaymentId: { contains: input.search } },
              { upiRef: { contains: input.search } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      db.payment.count({ where }),
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: skip(input),
        take: input.pageSize,
      }),
    ]);
    return paginated(rows.map(mapPayment), total, input);
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
    return db.$transaction(async (tx) => {
      const row = await tx.payment.update({
        where: { id: input.id },
        data: { status: 'FAILED', failureReason: input.failureReason },
      });
      if (row.subscriptionId)
        await tx.vehicleSubscription.update({
          where: { id: row.subscriptionId },
          data: { status: 'APPROVED' },
        });
      return mapPayment(row);
    });
  }

  async completeFromWebhook(input: CompleteWebhookPaymentInput): Promise<PaymentRecord | null> {
    return db.$transaction(async (tx) => {
      const current = await tx.payment.findFirst({ where: webhookPaymentWhere(input) });
      if (!current) return null;
      if (current.status === 'PAID') return mapPayment(current);
      const payment = await tx.payment.update({
        where: { id: current.id },
        data: {
          status: 'PAID',
          paidAt: current.paidAt ?? new Date(),
          razorpayOrderId: input.razorpayOrderId ?? current.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId ?? current.razorpayPaymentId,
          razorpaySignature: input.razorpaySignature ?? current.razorpaySignature,
          paymentMethod: input.paymentMethod ?? current.paymentMethod ?? 'razorpay',
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

  async failFromWebhook(input: FailWebhookPaymentInput): Promise<PaymentRecord | null> {
    return db.$transaction(async (tx) => {
      const current = await tx.payment.findFirst({ where: webhookPaymentWhere(input) });
      if (!current) return null;
      if (current.status === 'PAID') return mapPayment(current);
      const row = await tx.payment.update({
        where: { id: current.id },
        data: {
          status: 'FAILED',
          razorpayOrderId: input.razorpayOrderId ?? current.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId ?? current.razorpayPaymentId,
          failureReason: input.failureReason,
        },
      });
      if (row.subscriptionId)
        await tx.vehicleSubscription.update({
          where: { id: row.subscriptionId },
          data: { status: 'APPROVED' },
        });
      return mapPayment(row);
    });
  }
}

export const paymentPersistentStorageRepository = new PaymentPersistentStorageRepository();
