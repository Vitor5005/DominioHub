import { prisma } from '../../infrastructure/database/prisma.js';

import type { Prisma } from '../../generated/prisma/client.js';

import type {
  ProviderDomainDetails,
} from '../../infrastructure/providers/domains/domain-provider.js';

const publicDomainSelect = {
  id: true,
  organizationId: true,
  externalId: true,
  name: true,
  registrar: true,
  provider: true,
  status: true,
  expiresAt: true,
  dns: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const domainRepository = {
  listByOrganization(
    organizationId: string,
  ) {
    return prisma.domain.findMany({
      where: {
        organizationId,
      },

      select: publicDomainSelect,

      orderBy: {
        name: 'asc',
      },
    });
  },

  findByIdInOrganization(
    organizationId: string,
    id: string,
  ) {
    return prisma.domain.findFirst({
      where: {
        id,
        organizationId,
      },

      select: publicDomainSelect,
    });
  },

  upsertFromProvider(
    organizationId: string,
    providerName: string,
    domain: ProviderDomainDetails,
    ) {
    const dns = domain.dns as unknown as Prisma.InputJsonValue;

    return prisma.domain.upsert({
        where: {
        organizationId_name: {
            organizationId,
            name: domain.name,
        },
        },

        update: {
        externalId: domain.externalId,
        registrar: domain.registrar,
        provider: providerName,
        status: domain.status,
        expiresAt: domain.expiresAt,
        dns,
        },

        create: {
        organizationId,
        externalId: domain.externalId,
        name: domain.name,
        registrar: domain.registrar,
        provider: providerName,
        status: domain.status,
        expiresAt: domain.expiresAt,
        dns,
        },

        select: publicDomainSelect,
    });
    },
};