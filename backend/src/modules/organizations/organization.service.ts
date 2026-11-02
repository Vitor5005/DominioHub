import type { TenantContext } from '../../common/types/tenant-context.js';

import { organizationRepository } from './organization.repository.js';

export const organizationService = {
  async getCurrent(context: TenantContext) {
    const organization = await organizationRepository.findById(
      context.organizationId,
    );

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  },
};