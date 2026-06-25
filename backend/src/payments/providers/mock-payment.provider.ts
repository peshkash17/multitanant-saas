import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentProvider,
  CreatePaymentDto,
  PaymentResult,
  VerifyResult,
  RefundResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements IPaymentProvider {
  async createPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
    const paymentId = uuidv4();
    const providerPaymentId = `mock_${paymentId}`;

    return {
      paymentId,
      providerPaymentId,
      status: 'completed',
      amount: dto.amount,
      currency: dto.currency,
    };
  }

  async verifyPayment(paymentId: string): Promise<VerifyResult> {
    return {
      paymentId,
      status: 'completed',
      verified: true,
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    return {
      paymentId,
      refundId: `refund_${uuidv4()}`,
      status: 'refunded',
      amount: amount || 0,
    };
  }
}
