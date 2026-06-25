import { Role } from '../../organizations/entities/membership.entity';

export enum Permission {
  ORG_READ = 'org:read',
  ORG_MANAGE = 'org:manage',
  MEMBER_INVITE = 'member:invite',
  MEMBER_MANAGE = 'member:manage',
  PROJECT_READ = 'project:read',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  PAYMENT_READ = 'payment:read',
  PAYMENT_MANAGE = 'payment:manage',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.EDITOR]: [
    Permission.ORG_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
  ],
  [Role.VIEWER]: [
    Permission.ORG_READ,
    Permission.PROJECT_READ,
    Permission.TASK_READ,
  ],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
