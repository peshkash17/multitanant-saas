export interface CreatePaymentDto {
  organizationId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  paymentId: string;
  providerPaymentId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
}

export interface VerifyResult {
  paymentId: string;
  status: 'completed' | 'failed' | 'pending';
  verified: boolean;
}

export interface RefundResult {
  paymentId: string;
  refundId: string;
  status: 'refunded' | 'failed';
  amount: number;
}

export interface IPaymentProvider {
  createPayment(dto: CreatePaymentDto): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<VerifyResult>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
