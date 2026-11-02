import type {
  DomainProvider,
  ProviderDomainDetails,
  ProviderDomainSummary,
} from './domain-provider.js';

const mockDomains:
  ProviderDomainDetails[] = [
    {
      externalId: 'mock-domain-001',
      name: 'agencia-demo.com.br',
      registrar: 'Namecheap Mock',
      status: 'ACTIVE',

      expiresAt: new Date(
        '2027-10-01T00:00:00.000Z',
      ),

      dns: [
        {
          type: 'A',
          host: '@',
          value: '192.0.2.10',
          ttl: 1800,
        },

        {
          type: 'MX',
          host: '@',
          value:
            'mail.agencia-demo.com.br',
          ttl: 1800,
        },
      ],
    },

    {
      externalId: 'mock-domain-002',
      name: 'cliente-demo.com.br',
      registrar: 'Namecheap Mock',
      status: 'EXPIRING',

      expiresAt: new Date(
        '2026-12-10T00:00:00.000Z',
      ),

      dns: [
        {
          type: 'A',
          host: '@',
          value: '198.51.100.10',
          ttl: 1800,
        },

        {
          type: 'CNAME',
          host: 'www',
          value: 'cliente-demo.com.br',
          ttl: 1800,
        },

        {
          type: 'TXT',
          host: '@',
          value:
            'v=spf1 include:example.com ~all',
          ttl: 1800,
        },
      ],
    },

    {
      externalId: 'mock-domain-003',
      name: 'portfolio-digital.com',
      registrar: 'Namecheap Mock',
      status: 'ACTIVE',

      expiresAt: new Date(
        '2028-03-15T00:00:00.000Z',
      ),

      dns: [
        {
          type: 'A',
          host: '@',
          value: '203.0.113.25',
          ttl: 3600,
        },
      ],
    },
  ];

export class MockDomainProvider
  implements DomainProvider
{
  readonly name = 'mock-namecheap';

  async listDomains():
    Promise<ProviderDomainSummary[]> {
    return mockDomains.map(
      (domain) => ({
        externalId:
          domain.externalId,

        name: domain.name,
      }),
    );
  }

  async getDomainDetails(
    domainName: string,
  ): Promise<
    ProviderDomainDetails | null
  > {
    const domain =
      mockDomains.find(
        (item) =>
          item.name === domainName,
      );

    return domain ?? null;
  }
}