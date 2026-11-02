export interface ReceiveExternalEventInput {
  organizationSlug: string;
  externalId: string;
  type: string;
  payload: unknown;
}