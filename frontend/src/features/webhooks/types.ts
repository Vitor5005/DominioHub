import type {
  EventStatus,
} from '../events/types';

export type WebhookDeliveryStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED';

export interface WebhookEndpoint {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpointListResponse {
  endpoints: WebhookEndpoint[];
}

export interface CreateWebhookEndpointInput {
  url: string;
}

export interface CreateWebhookEndpointResponse {
  endpoint: WebhookEndpoint;
  secret: string;
}

export interface UpdateWebhookEndpointInput {
  url?: string;
  active?: boolean;
}

export interface UpdateWebhookEndpointResponse {
  endpoint: WebhookEndpoint;
}

export interface WebhookDeliveryEvent {
  id: string;
  organizationId: string;
  externalId: string;
  type: string;
  status: EventStatus;
  receivedAt: string;
  processedAt: string | null;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventId: string;
  attempt: number;
  status: WebhookDeliveryStatus;
  httpStatus: number | null;
  errorMessage: string | null;
  attemptedAt: string;
  endpoint: WebhookEndpoint;
  event: WebhookDeliveryEvent;
}

export interface WebhookDeliveryListResponse {
  deliveries: WebhookDelivery[];
}
