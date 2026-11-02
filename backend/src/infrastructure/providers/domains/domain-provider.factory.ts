import { env } from '../../../config/env.js';

import type {
  DomainProvider,
} from './domain-provider.js';

import {
  MockDomainProvider,
} from './mock-domain.provider.js';

export function createDomainProvider():
  DomainProvider {
  switch (env.DOMAIN_PROVIDER) {
    case 'mock':
      return new MockDomainProvider();
  }
}

export const domainProvider =
  createDomainProvider();