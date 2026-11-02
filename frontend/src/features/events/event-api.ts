import {
  apiRequest,
} from '../../services/api-client';

import type {
  EventDetailResponse,
  EventListResponse,
} from './types';

export const eventApi = {
  list() {
    return apiRequest<EventListResponse>(
      '/events',
      {
        method: 'GET',
      },
    );
  },

  getById(
    eventId: string,
  ) {
    return apiRequest<EventDetailResponse>(
      `/events/${encodeURIComponent(
        eventId,
      )}`,
      {
        method: 'GET',
      },
    );
  },
};
