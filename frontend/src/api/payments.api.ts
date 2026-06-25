import { apiClient } from './client';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  organizationId: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  providerPaymentId?: string;
  provider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  amount: number;
  currency: string;
  description?: string;
}

export const paymentsApi = {
  list: (orgId: string) =>
    apiClient.get<Payment[]>(`/organizations/${orgId}/payments`).then((r) => r.data),

  create: (orgId: string, data: CreatePaymentData) =>
    apiClient.post<Payment>(`/organizations/${orgId}/payments`, data).then((r) => r.data),

  verify: (orgId: string, paymentId: string) =>
    apiClient
      .post(`/organizations/${orgId}/payments/${paymentId}/verify`)
      .then((r) => r.data),

  refund: (orgId: string, paymentId: string) =>
    apiClient
      .post(`/organizations/${orgId}/payments/${paymentId}/refund`)
      .then((r) => r.data),
};
