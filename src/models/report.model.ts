export type ReportRange = {
  from: Date;
  to: Date;
};

export type OwnerReportSummary = {
  revenue: string;
  paidPayments: number;
  failedPayments: number;
  requestedSubscriptions: number;
  activeSubscriptions: number;
  completedWashes: number;
  unavailableWashes: number;
  openComplaints: number;
  resolvedComplaints: number;
};
