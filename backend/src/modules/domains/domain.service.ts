import type {
  TenantContext,
} from '../../common/types/tenant-context.js';

import {
  domainProvider,
} from '../../infrastructure/providers/domains/domain-provider.factory.js';

import {
  DomainNotFoundError,
  DomainProviderError,
} from './domain.errors.js';

import {
  domainRepository,
} from './domain.repository.js';

import {
  cacheService,
} from '../../infrastructure/cache/cache.service.js';

import {
  domainCacheKeys,
} from './domain.cache.js';

type DomainList =
  Awaited<
    ReturnType<
      typeof domainRepository.listByOrganization
    >
  >;

export const domainService = {
  async list(
    context: TenantContext,
  ) {
    const cacheKey =
      domainCacheKeys.list(
        context.organizationId,
      );

    const cached =
      await cacheService.getJson<DomainList>(
        cacheKey,
      );

    if (cached.status === 'HIT') {
      return {
        domains: cached.value,
        cache: 'HIT' as const,
      };
    }

    const domains =
      await domainRepository
        .listByOrganization(
          context.organizationId,
        );

    await cacheService.setJson(
      cacheKey,
      domains,
    );

    return {
      domains,
      cache: cached.status,
    };
  },

  async getById(
    context: TenantContext,
    domainId: string,
  ) {
    const domain =
      await domainRepository
        .findByIdInOrganization(
          context.organizationId,
          domainId,
        );

    if (!domain) {
      throw new DomainNotFoundError();
    }

    return domain;
  },

  async sync(
    context: TenantContext,
  ) {
    let providerDomains;

    try {
      providerDomains =
        await domainProvider.listDomains();
    } catch {
      throw new DomainProviderError();
    }

    const synchronizedDomains = [];

    for (const providerDomain of providerDomains) {
      let details;

      try {
        details =
          await domainProvider.getDomainDetails(
            providerDomain.name,
          );
      } catch {
        throw new DomainProviderError();
      }

      if (!details) {
        continue;
      }

      const persistedDomain =
        await domainRepository.upsertFromProvider(
          context.organizationId,
          domainProvider.name,
          details,
        );

      synchronizedDomains.push(
        persistedDomain,
      );
    }

    const cacheInvalidated =
      await cacheService.delete(
        domainCacheKeys.list(
          context.organizationId,
        ),
      );

    return {
      provider: domainProvider.name,
      synchronized:
        synchronizedDomains.length,
      cacheInvalidated,
      domains:
        synchronizedDomains,
    };
  },
};