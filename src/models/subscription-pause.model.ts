export type SubscriptionPauseRecord = {
  id: string;
  businessId: string;
  subscriptionId: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  createdAt: Date;
};

export type PauseSubscriptionRecord = {
  id: string;
  businessId: string;
  customerId: string;
  status: string;
};

export type CreateSubscriptionPauseInput = {
  businessId: string;
  subscriptionId: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
};
