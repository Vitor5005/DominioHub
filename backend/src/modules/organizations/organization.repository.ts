import { prisma } from '../../infrastructure/database/prisma.js';

import type { CreateOrganizationInput } from './organization.types.js';

export const organizationRepository = {
  findById(id: string) {
    return prisma.organization.findUnique({
      where: {
        id,
      },
    });
  },

  findBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: {
        slug,
      },
    });
  },

  create(data: CreateOrganizationInput) {
    return prisma.organization.create({
      data,
    });
  },

  findEventIngestConfiguration(
    slug: string,
  ) {
    return prisma.organization.findUnique({
      where: {
        slug,
      },

      select: {
        id: true,
        slug: true,
        eventIngestKeyHash: true,
      },
    });
  },
};