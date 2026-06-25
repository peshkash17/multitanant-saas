import { apiClient } from './client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  role?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string; avatarUrl?: string };
}

export const organizationsApi = {
  create: (data: { name: string; slug: string; description?: string }) =>
    apiClient.post<Organization>('/organizations', data).then((r) => r.data),

  list: () =>
    apiClient.get<Organization[]>('/organizations').then((r) => r.data),

  getOne: (orgId: string) =>
    apiClient.get<Organization>(`/organizations/${orgId}`).then((r) => r.data),

  update: (orgId: string, data: Partial<Organization>) =>
    apiClient.put<Organization>(`/organizations/${orgId}`, data).then((r) => r.data),

  delete: (orgId: string) =>
    apiClient.delete(`/organizations/${orgId}`),

  getMembers: (orgId: string) =>
    apiClient.get<Member[]>(`/organizations/${orgId}/members`).then((r) => r.data),

  inviteMember: (orgId: string, data: { email: string; role: string }) =>
    apiClient.post(`/organizations/${orgId}/members`, data).then((r) => r.data),

  updateMemberRole: (orgId: string, memberId: string, role: string) =>
    apiClient
      .put(`/organizations/${orgId}/members/${memberId}/role`, { role })
      .then((r) => r.data),

  removeMember: (orgId: string, memberId: string) =>
    apiClient.delete(`/organizations/${orgId}/members/${memberId}`),
};
