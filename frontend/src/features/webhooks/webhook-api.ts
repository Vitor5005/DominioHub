import {
  apiRequest,
} from '../../services/api-client';

import type {
  CreateWebhookEndpointInput,
  CreateWebhookEndpointResponse,
  UpdateWebhookEndpointInput,
  UpdateWebhookEndpointResponse,
  WebhookDeliveryListResponse,
  WebhookEndpointListResponse,
} from './types';

export const webhookApi = {
  listEndpoints() {
    return apiRequest<WebhookEndpointListResponse>(
      '/webhooks/endpoints',
      {
        method: 'GET',
      },
    );
  },

  createEndpoint(
    input: CreateWebhookEndpointInput,
  ) {
    return apiRequest<CreateWebhookEndpointResponse>(
      '/webhooks/endpoints',
      {
        method: 'POST',
        json: input,
      },
    );
  },

  updateEndpoint(
    endpointId: string,
    input: UpdateWebhookEndpointInput,
  ) {
    return apiRequest<UpdateWebhookEndpointResponse>(
      `/webhooks/endpoints/${encodeURIComponent(
        endpointId,
      )}`,
      {
        method: 'PATCH',
        json: input,
      },
    );
  },

  listDeliveries() {
    return apiRequest<WebhookDeliveryListResponse>(
      '/webhooks/deliveries',
      {
        method: 'GET',
      },
    );
  },
};
