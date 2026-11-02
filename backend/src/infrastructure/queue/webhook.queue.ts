import { Queue } from 'bullmq';

import { queueProducerRedis } from './queue-connections.js';

export type WebhookDeliveryJobData = {
  organizationId: string;
  eventId: string;
  endpointId: string;
};

export const webhookDeliveryQueue =
  new Queue<WebhookDeliveryJobData>(
    'webhook-delivery',
    {
      connection: queueProducerRedis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 500,
        },
      },
    },
  );

export async function enqueueWebhookDelivery(
  organizationId: string,
  eventId: string,
  endpointId: string,
) {
  await webhookDeliveryQueue.add(
    'deliver-webhook',
    {
      organizationId,
      eventId,
      endpointId,
    },
    {
      jobId: `webhook-${endpointId}-${eventId}`,
    },
  );
}
