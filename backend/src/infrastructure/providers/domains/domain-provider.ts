export type ProviderDomainStatus =
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'UNKNOWN';

export interface ProviderDnsRecord {
  type: string;
  host: string;
  value: string;
  ttl: number;
}

export interface ProviderDomainSummary {
  externalId: string;
  name: string;
}

export interface ProviderDomainDetails {
  externalId: string;
  name: string;
  registrar: string | null;
  status: ProviderDomainStatus;
  expiresAt: Date | null;
  dns: ProviderDnsRecord[];
}

export interface DomainProvider {
  readonly name: string;

  listDomains(): Promise<
    ProviderDomainSummary[]
  >;

  getDomainDetails(
    domainName: string,
  ): Promise<
    ProviderDomainDetails | null
  >;
}