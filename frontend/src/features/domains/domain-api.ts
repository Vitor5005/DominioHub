import {
  apiRequest,
} from '../../services/api-client';

import type {
  DomainDetailResponse,
  DomainListResponse,
  DomainSyncResponse,
} from './types';

export const domainApi = {
  list() {
    return apiRequest<DomainListResponse>(
      '/domains',
      {
        method: 'GET',
      },
    );
  },

  getById(
    domainId: string,
  ) {
    return apiRequest<DomainDetailResponse>(
      `/domains/${encodeURIComponent(
        domainId,
      )}`,
      {
        method: 'GET',
      },
    );
  },

  sync() {
    return apiRequest<DomainSyncResponse>(
      '/domains/sync',
      {
        method: 'POST',
      },
    );
  },
};
