import { Queue } from 'bullmq';

import { queueProducerRedis } from './queue-connections.js';

export type EventProcessingJobData = {
  eventId: string;
  organizationId: string;
};

export const eventQueue = new Queue<EventProcessingJobData>(
  'event-processing',
  {
    connection: queueProducerRedis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
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

export async function enqueueEventProcessing(
  eventId: string,
  organizationId: string,
) {
  await eventQueue.add(
    'process-event',
    {
      eventId,
      organizationId,
    },
    {
      jobId: `event-${eventId}`,
    },
  );
}
