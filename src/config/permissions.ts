import type { UserRole } from '@/types/domain'

export type Permission =
  | 'members:manage'
  | 'brand:edit'
  | 'brand:setup:edit'
  | 'content:plan:create'
  | 'content:generate'
  | 'content:edit'
  | 'content:approve'
  | 'content:assets:upload'
  | 'reports:view'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'members:manage',
    'brand:edit',
    'brand:setup:edit',
    'content:plan:create',
    'content:generate',
    'content:edit',
    'content:approve',
    'content:assets:upload',
    'reports:view',
  ],
  product_owner: [
    'brand:edit',
    'brand:setup:edit',
    'content:plan:create',
    'content:generate',
    'content:edit',
    'content:approve',
    'reports:view',
  ],
  content: [
    'content:assets:upload',
    'content:edit',
    'reports:view',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function rolesWithPermission(permission: Permission): UserRole[] {
  return (Object.entries(ROLE_PERMISSIONS) as [UserRole, Permission[]][])
    .filter(([, permissions]) => permissions.includes(permission))
    .map(([role]) => role)
}
