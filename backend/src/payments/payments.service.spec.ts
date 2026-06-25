import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { PAYMENT_PROVIDER } from './interfaces/payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';

const mockPaymentRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let provider: MockPaymentProvider;

  beforeEach(async () => {
    provider = new MockPaymentProvider();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PAYMENT_PROVIDER, useValue: provider },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment and return completed status', async () => {
      const payment = { id: 'pay-1', amount: 99.99, currency: 'USD', status: PaymentStatus.COMPLETED };
      mockPaymentRepo.create.mockReturnValue(payment);
      mockPaymentRepo.save.mockResolvedValue(payment);

      const result = await service.createPayment('org-1', { amount: 99.99, currency: 'USD' });

      expect(result).toHaveProperty('providerResult');
      expect(result.providerResult.status).toBe('completed');
    });
  });

  describe('verifyPayment', () => {
    it('should verify an existing payment', async () => {
      const payment = { id: 'pay-1', organizationId: 'org-1', providerPaymentId: 'mock_pay-1', status: PaymentStatus.PENDING };
      mockPaymentRepo.findOne.mockResolvedValue(payment);
      mockPaymentRepo.save.mockResolvedValue({ ...payment, status: PaymentStatus.COMPLETED });

      const result = await service.verifyPayment('org-1', 'pay-1');
      expect(result.verification.verified).toBe(true);
    });

    it('should throw NotFoundException for missing payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyPayment('org-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('MockPaymentProvider', () => {
    it('createPayment returns completed status', async () => {
      const result = await provider.createPayment({ organizationId: 'org-1', amount: 10, currency: 'USD' });
      expect(result.status).toBe('completed');
      expect(result.providerPaymentId).toMatch(/^mock_/);
    });

    it('verifyPayment returns verified=true', async () => {
      const result = await provider.verifyPayment('any-id');
      expect(result.verified).toBe(true);
    });

    it('refundPayment returns refunded status', async () => {
      const result = await provider.refundPayment('any-id', 50);
      expect(result.status).toBe('refunded');
      expect(result.amount).toBe(50);
    });
  });
});
