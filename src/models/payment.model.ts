export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentRecord = {
  id: string;
  businessId: string;
  customerId: string;
  subscriptionId?: string | null;
  bookingId?: string | null;
  amount: string;
  status: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  paymentMethod?: string | null;
  upiRef?: string | null;
  receiptId?: string | null;
  currency: string;
  failureReason?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSubscriptionPaymentInput = {
  businessId: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  receiptId?: string;
};

export type CompletePaymentInput = {
  id: string;
  businessId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentMethod?: string;
  upiRef?: string;
};

export type FailPaymentInput = {
  id: string;
  businessId: string;
  failureReason?: string;
};
