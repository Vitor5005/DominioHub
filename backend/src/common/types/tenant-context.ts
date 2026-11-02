export interface TenantContext {
  organizationId: string;
}

export function createTenantContext(
  user: {
    organizationId: string;
  },
): TenantContext {
  return {
    organizationId: user.organizationId,
  };
}