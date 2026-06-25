import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PAYMENT_PROVIDER,
  IPaymentProvider,
} from './interfaces/payment-provider.interface';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentRequestDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private paymentProvider: IPaymentProvider,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async createPayment(orgId: string, dto: CreatePaymentRequestDto) {
    const result = await this.paymentProvider.createPayment({
      organizationId: orgId,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
    });

    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        organizationId: orgId,
        amount: dto.amount,
        currency: dto.currency,
        status: result.status === 'completed' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
        providerPaymentId: result.providerPaymentId,
        provider: 'mock',
      }),
    );

    return { ...payment, providerResult: result };
  }

  async verifyPayment(orgId: string, paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, organizationId: orgId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const result = await this.paymentProvider.verifyPayment(payment.providerPaymentId);

    if (result.verified) {
      payment.status = PaymentStatus.COMPLETED;
      await this.paymentRepo.save(payment);
    }

    return { payment, verification: result };
  }

  async refundPayment(orgId: string, paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, organizationId: orgId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const result = await this.paymentProvider.refundPayment(
      payment.providerPaymentId,
      payment.amount,
    );

    payment.status = PaymentStatus.REFUNDED;
    await this.paymentRepo.save(payment);

    return { payment, refund: result };
  }

  async listPayments(orgId: string) {
    return this.paymentRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }
}
