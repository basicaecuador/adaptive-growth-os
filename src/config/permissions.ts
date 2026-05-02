import type { UserRole } from '@/types/domain'

export type Permission =
  | 'org:manage'
  | 'org:members:manage'
  | 'brand:create'
  | 'brand:edit'
  | 'brand:delete'
  | 'brand:setup:edit'
  | 'content:plan:create'
  | 'content:generate'
  | 'content:edit'
  | 'content:approve'
  | 'content:publish'
  | 'rules:manage'
  | 'reports:view'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'org:manage',
    'org:members:manage',
    'brand:create',
    'brand:edit',
    'brand:delete',
    'brand:setup:edit',
    'content:plan:create',
    'content:generate',
    'content:edit',
    'content:approve',
    'content:publish',
    'rules:manage',
    'reports:view',
  ],
  admin: [
    'org:members:manage',
    'brand:create',
    'brand:edit',
    'brand:setup:edit',
    'content:plan:create',
    'content:generate',
    'content:edit',
    'content:approve',
    'content:publish',
    'rules:manage',
    'reports:view',
  ],
  editor: ['content:generate', 'content:edit', 'reports:view'],
  viewer: ['reports:view'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function rolesWithPermission(permission: Permission): UserRole[] {
  return (Object.entries(ROLE_PERMISSIONS) as [UserRole, Permission[]][])
    .filter(([, permissions]) => permissions.includes(permission))
    .map(([role]) => role)
}
