export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentRecord = {
  id: string;
  businessId: string;
  customerId: string;
  subscriptionId?: string | null;
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

export type RazorpayCheckoutOrder = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
};

export type StartSubscriptionPaymentResult = {
  payment: PaymentRecord;
  gateway?: RazorpayCheckoutOrder;
};

export type CreateSubscriptionPaymentInput = {
  businessId: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  receiptId?: string;
};

export type AttachRazorpayOrderInput = {
  id: string;
  businessId: string;
  razorpayOrderId: string;
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

export type CompleteWebhookPaymentInput = {
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentMethod?: string;
};

export type FailWebhookPaymentInput = {
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  failureReason?: string;
};
