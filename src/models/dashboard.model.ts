export type OwnerDashboardSummary = {
  customers: number;
  workers: number;
  vehicles: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  todayWashes: number;
  unreadComplaints: number;
  paidRevenue: string;
};

export type CustomerDashboardSummary = {
  vehicles: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  todayWashes: number;
  unreadNotifications: number;
  totalPaid: string;
};
