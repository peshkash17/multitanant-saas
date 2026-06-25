import { apiClient } from './client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  organizationId: string;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  create: (orgId: string, data: { name: string; description?: string }) =>
    apiClient
      .post<Project>(`/organizations/${orgId}/projects`, data)
      .then((r) => r.data),

  list: (orgId: string) =>
    apiClient
      .get<Project[]>(`/organizations/${orgId}/projects`)
      .then((r) => r.data),

  getOne: (orgId: string, projectId: string) =>
    apiClient
      .get<Project>(`/organizations/${orgId}/projects/${projectId}`)
      .then((r) => r.data),

  update: (orgId: string, projectId: string, data: Partial<Project>) =>
    apiClient
      .put<Project>(`/organizations/${orgId}/projects/${projectId}`, data)
      .then((r) => r.data),

  delete: (orgId: string, projectId: string) =>
    apiClient.delete(`/organizations/${orgId}/projects/${projectId}`),

  getStats: (orgId: string) =>
    apiClient
      .get<{ total: number }>(`/organizations/${orgId}/projects/stats`)
      .then((r) => r.data),
};
