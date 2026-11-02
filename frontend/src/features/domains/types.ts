export type DomainStatus =
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'UNKNOWN';

export interface DomainDnsRecord {
  type: string;
  host: string;
  value: string;
  ttl: number;
}

export interface DomainRecord {
  id: string;
  organizationId: string;

  externalId: string | null;
  name: string;

  registrar: string | null;
  provider: string;

  status: DomainStatus;
  expiresAt: string | null;

  dns: DomainDnsRecord[] | null;

  createdAt: string;
  updatedAt: string;
}

export interface DomainListResponse {
  domains: DomainRecord[];

  cache:
    | 'HIT'
    | 'MISS'
    | 'BYPASS';
}

export interface DomainDetailResponse {
  domain: DomainRecord;
}

export interface DomainSyncResponse {
  provider: string;
  synchronized: number;
  cacheInvalidated: boolean;
  domains: DomainRecord[];
}
