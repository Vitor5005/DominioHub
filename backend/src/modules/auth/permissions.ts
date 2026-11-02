import type { Role } from '../../generated/prisma/client.js';

export const permissions = [
  'users:read',
  'users:manage',

  'domains:read',
  'domains:manage',

  'events:read',

  'webhooks:read',
  'webhooks:manage',

  'chat:use',
] as const;

export type Permission =
  (typeof permissions)[number];

const rolePermissions: Record<
  Role,
  readonly Permission[]
> = {
  ADMIN: [
    'users:read',
    'users:manage',

    'domains:read',
    'domains:manage',

    'events:read',

    'webhooks:read',
    'webhooks:manage',

    'chat:use',
  ],

  OPERATOR: [
    'domains:read',
    'domains:manage',

    'events:read',

    'webhooks:read',
    'webhooks:manage',

    'chat:use',
  ],

  SUPPORT: [
    'domains:read',

    'events:read',

    'webhooks:read',

    'chat:use',
  ],
};

export function getPermissionsForRole(
  role: Role,
): readonly Permission[] {
  return rolePermissions[role];
}

export function hasPermission(
  role: Role,
  permission: Permission,
): boolean {
  return rolePermissions[role].includes(
    permission,
  );
}