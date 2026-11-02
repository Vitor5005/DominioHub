export type EventStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED';

export interface OperationalEvent {
  id: string;
  organizationId: string;

  externalId: string;
  type: string;

  payload: unknown;

  status: EventStatus;

  receivedAt: string;
  processedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface EventListResponse {
  events: OperationalEvent[];
}

export interface EventDetailResponse {
  event: OperationalEvent;
}
