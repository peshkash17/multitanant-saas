import { apiClient } from './client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  assigneeId?: string;
  assignee?: { id: string; name: string; email: string; avatarUrl?: string };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const tasksApi = {
  create: (
    orgId: string,
    projectId: string,
    data: Partial<Task>,
  ) =>
    apiClient
      .post<Task>(`/organizations/${orgId}/projects/${projectId}/tasks`, data)
      .then((r) => r.data),

  list: (orgId: string, projectId: string) =>
    apiClient
      .get<Task[]>(`/organizations/${orgId}/projects/${projectId}/tasks`)
      .then((r) => r.data),

  getOne: (orgId: string, projectId: string, taskId: string) =>
    apiClient
      .get<Task>(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`)
      .then((r) => r.data),

  update: (orgId: string, projectId: string, taskId: string, data: Partial<Task>) =>
    apiClient
      .put<Task>(
        `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
        data,
      )
      .then((r) => r.data),

  delete: (orgId: string, projectId: string, taskId: string) =>
    apiClient.delete(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
    ),
};
