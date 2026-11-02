import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  cacheService: {
    getJson: vi.fn(),
    setJson: vi.fn(),
    delete: vi.fn(),
  },
  domainRepository: {
    listByOrganization: vi.fn(),
    upsertFromProvider: vi.fn(),
  },
  domainProvider: {
    name: 'mock-provider',
    listDomains: vi.fn(),
    getDomainDetails: vi.fn(),
  },
}));

vi.mock(
  '../../infrastructure/cache/cache.service.js',
  () => ({ cacheService: mocks.cacheService }),
);

vi.mock(
  '../../modules/domains/domain.repository.js',
  () => ({ domainRepository: mocks.domainRepository }),
);

vi.mock(
  '../../infrastructure/providers/domains/domain-provider.factory.js',
  () => ({ domainProvider: mocks.domainProvider }),
);

import {
  domainCacheKeys,
} from '../../modules/domains/domain.cache.js';
import {
  domainService,
} from '../../modules/domains/domain.service.js';

const context = {
  organizationId: 'organization-a',
};

describe('domain cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached domains without querying the repository on HIT', async () => {
    const domains = [{ id: 'domain-1', name: 'cached.test' }];

    mocks.cacheService.getJson.mockResolvedValue({
      status: 'HIT',
      value: domains,
    });

    await expect(domainService.list(context)).resolves.toEqual({
      domains,
      cache: 'HIT',
    });

    expect(
      mocks.domainRepository.listByOrganization,
    ).not.toHaveBeenCalled();
  });

  it('loads and caches domains on a cache MISS', async () => {
    const domains = [{ id: 'domain-2', name: 'miss.test' }];

    mocks.cacheService.getJson.mockResolvedValue({
      status: 'MISS',
      value: null,
    });
    mocks.domainRepository.listByOrganization.mockResolvedValue(
      domains,
    );
    mocks.cacheService.setJson.mockResolvedValue(true);

    await expect(domainService.list(context)).resolves.toEqual({
      domains,
      cache: 'MISS',
    });

    expect(
      mocks.domainRepository.listByOrganization,
    ).toHaveBeenCalledWith(context.organizationId);
    expect(mocks.cacheService.setJson).toHaveBeenCalledWith(
      domainCacheKeys.list(context.organizationId),
      domains,
    );
  });

  it('queries the repository when cache access is bypassed', async () => {
    const domains = [{ id: 'domain-3', name: 'bypass.test' }];

    mocks.cacheService.getJson.mockResolvedValue({
      status: 'BYPASS',
      value: null,
    });
    mocks.domainRepository.listByOrganization.mockResolvedValue(
      domains,
    );
    mocks.cacheService.setJson.mockResolvedValue(true);

    await expect(domainService.list(context)).resolves.toEqual({
      domains,
      cache: 'BYPASS',
    });

    expect(
      mocks.domainRepository.listByOrganization,
    ).toHaveBeenCalledWith(context.organizationId);
  });

  it('invalidates the organization cache after a successful sync', async () => {
    const providerDetails = {
      externalId: 'provider-domain-1',
      name: 'sync.test',
      registrar: 'Mock Registrar',
      status: 'ACTIVE',
      expiresAt: null,
      dns: [],
    };
    const persistedDomain = {
      id: 'domain-4',
      name: providerDetails.name,
    };
    const operations: string[] = [];

    mocks.domainProvider.listDomains.mockResolvedValue([
      {
        externalId: providerDetails.externalId,
        name: providerDetails.name,
      },
    ]);
    mocks.domainProvider.getDomainDetails.mockResolvedValue(
      providerDetails,
    );
    mocks.domainRepository.upsertFromProvider.mockImplementation(
      async () => {
        operations.push('persist');
        return persistedDomain;
      },
    );
    mocks.cacheService.delete.mockImplementation(
      async () => {
        operations.push('invalidate');
        return true;
      },
    );

    await domainService.sync(context);

    expect(
      mocks.domainRepository.upsertFromProvider,
    ).toHaveBeenCalledWith(
      context.organizationId,
      'mock-provider',
      providerDetails,
    );
    expect(mocks.cacheService.delete).toHaveBeenCalledWith(
      domainCacheKeys.list(context.organizationId),
    );
    expect(operations).toEqual([
      'persist',
      'invalidate',
    ]);
  });

  it('uses different cache keys for different organizations', () => {
    expect(
      domainCacheKeys.list('organization-a'),
    ).not.toBe(domainCacheKeys.list('organization-b'));
  });
});
