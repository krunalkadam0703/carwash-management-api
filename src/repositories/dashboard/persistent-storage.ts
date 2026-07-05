import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { CustomerDashboardSummary, OwnerDashboardSummary } from '../../models/dashboard.model.js';

type CountDelegate = { count(args: unknown): Promise<number> };
type PaymentDelegate = CountDelegate & { aggregate(args: unknown): Promise<{ _sum: { amount?: { toString(): string } | null } }> };
type AppDb = {
  user: CountDelegate;
  vehicle: CountDelegate;
  vehicleSubscription: CountDelegate;
  dailyWashSchedule: CountDelegate;
  complaint: CountDelegate;
  notification: CountDelegate;
  payment: PaymentDelegate;
};

const db = prisma as unknown as AppDb;

export class DashboardPersistentStorageRepository {
  async ownerSummary(businessId: string): Promise<OwnerDashboardSummary> {
    const today = this.today();
    const [customers, workers, vehicles, activeSubscriptions, pendingSubscriptions, todayWashes, unreadComplaints, paidRevenue] = await Promise.all([
      db.user.count({ where: { businessId, role: 'CUSTOMER' } }),
      db.user.count({ where: { businessId, role: 'WORKER' } }),
      db.vehicle.count({ where: { businessId } }),
      db.vehicleSubscription.count({ where: { businessId, status: 'ACTIVE' } }),
      db.vehicleSubscription.count({ where: { businessId, status: 'REQUESTED' } }),
      db.dailyWashSchedule.count({ where: { businessId, washDate: today } }),
      db.complaint.count({ where: { businessId, status: { in: ['OPEN', 'IN_REVIEW'] } } }),
      db.payment.aggregate({ where: { businessId, status: 'PAID' }, _sum: { amount: true } }),
    ]);

    return { customers, workers, vehicles, activeSubscriptions, pendingSubscriptions, todayWashes, unreadComplaints, paidRevenue: paidRevenue._sum.amount?.toString() ?? '0' };
  }

  async customerSummary(businessId: string, customerId: string): Promise<CustomerDashboardSummary> {
    const today = this.today();
    const [vehicles, activeSubscriptions, pendingSubscriptions, todayWashes, unreadNotifications, totalPaid] = await Promise.all([
      db.vehicle.count({ where: { businessId, customerId } }),
      db.vehicleSubscription.count({ where: { businessId, customerId, status: 'ACTIVE' } }),
      db.vehicleSubscription.count({ where: { businessId, customerId, status: { in: ['REQUESTED', 'APPROVED', 'PAYMENT_PENDING'] } } }),
      db.dailyWashSchedule.count({ where: { businessId, customerId, washDate: today } }),
      db.notification.count({ where: { userId: customerId, status: 'UNREAD' } }),
      db.payment.aggregate({ where: { businessId, customerId, status: 'PAID' }, _sum: { amount: true } }),
    ]);

    return { vehicles, activeSubscriptions, pendingSubscriptions, todayWashes, unreadNotifications, totalPaid: totalPaid._sum.amount?.toString() ?? '0' };
  }

  private today(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }
}

export const dashboardPersistentStorageRepository = new DashboardPersistentStorageRepository();
