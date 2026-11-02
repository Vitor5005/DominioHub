import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  getPermissionsForRole,
  hasPermission,
} from '../../modules/auth/permissions.js';

describe('RBAC permissions', () => {
  it('grants all critical management permissions to ADMIN', () => {
    const permissions =
      getPermissionsForRole('ADMIN');

    expect(permissions).toContain('users:manage');
    expect(permissions).toContain('domains:manage');
    expect(permissions).toContain('webhooks:manage');
    expect(permissions).toContain('chat:use');
  });

  it('limits OPERATOR user management while allowing operations', () => {
    expect(
      hasPermission('OPERATOR', 'users:manage'),
    ).toBe(false);
    expect(
      hasPermission('OPERATOR', 'domains:manage'),
    ).toBe(true);
    expect(
      hasPermission('OPERATOR', 'webhooks:manage'),
    ).toBe(true);
    expect(
      hasPermission('OPERATOR', 'chat:use'),
    ).toBe(true);
  });

  it('keeps SUPPORT read/chat only for critical permissions', () => {
    const permissions =
      getPermissionsForRole('SUPPORT');

    expect(permissions).toContain('domains:read');
    expect(permissions).toContain('events:read');
    expect(permissions).toContain('webhooks:read');
    expect(permissions).toContain('chat:use');
    expect(permissions).not.toContain('users:manage');
    expect(permissions).not.toContain('domains:manage');
    expect(permissions).not.toContain('webhooks:manage');
  });
});
