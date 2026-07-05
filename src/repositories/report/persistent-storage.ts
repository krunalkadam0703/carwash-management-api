import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { OwnerReportSummary, ReportRange } from '../../models/report.model.js';

type CountDelegate = { count(args: unknown): Promise<number> };
type PaymentDelegate = CountDelegate & { aggregate(args: unknown): Promise<{ _sum: { amount?: { toString(): string } | null } }> };
type AppDb = {
  payment: PaymentDelegate;
  vehicleSubscription: CountDelegate;
  dailyWashSchedule: CountDelegate;
  complaint: CountDelegate;
};

const db = prisma as unknown as AppDb;

export class ReportPersistentStorageRepository {
  async ownerSummary(businessId: string, range: ReportRange): Promise<OwnerReportSummary> {
    const createdAt = { gte: range.from, lte: range.to };
    const washDate = { gte: range.from, lte: range.to };
    const [revenue, paidPayments, failedPayments, requestedSubscriptions, activeSubscriptions, completedWashes, unavailableWashes, openComplaints, resolvedComplaints] =
      await Promise.all([
        db.payment.aggregate({ where: { businessId, status: 'PAID', paidAt: createdAt }, _sum: { amount: true } }),
        db.payment.count({ where: { businessId, status: 'PAID', createdAt } }),
        db.payment.count({ where: { businessId, status: 'FAILED', createdAt } }),
        db.vehicleSubscription.count({ where: { businessId, status: 'REQUESTED', createdAt } }),
        db.vehicleSubscription.count({ where: { businessId, status: 'ACTIVE' } }),
        db.dailyWashSchedule.count({ where: { businessId, status: 'COMPLETED', washDate } }),
        db.dailyWashSchedule.count({ where: { businessId, status: 'UNAVAILABLE', washDate } }),
        db.complaint.count({ where: { businessId, status: { in: ['OPEN', 'IN_REVIEW'] }, createdAt } }),
        db.complaint.count({ where: { businessId, status: 'RESOLVED', createdAt } }),
      ]);

    return {
      revenue: revenue._sum.amount?.toString() ?? '0',
      paidPayments,
      failedPayments,
      requestedSubscriptions,
      activeSubscriptions,
      completedWashes,
      unavailableWashes,
      openComplaints,
      resolvedComplaints,
    };
  }
}

export const reportPersistentStorageRepository = new ReportPersistentStorageRepository();
