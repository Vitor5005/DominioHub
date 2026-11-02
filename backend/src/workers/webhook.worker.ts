import { Worker } from 'bullmq';

import {
  queueWorkerRedis,
} from '../infrastructure/queue/queue-connections.js';
import {
  type WebhookDeliveryJobData,
} from '../infrastructure/queue/webhook.queue.js';
import {
  processWebhookDelivery,
} from '../modules/webhooks/webhook-delivery.processor.js';
import {
  logger,
  serializeError,
} from '../common/logging/logger.js';

const webhookWorker = new Worker<WebhookDeliveryJobData>(
  'webhook-delivery',
  async (job) => {
    await processWebhookDelivery(job);
  },
  {
    connection: queueWorkerRedis,
    concurrency: 5,
  },
);

webhookWorker.on('completed', (job) => {
  logger.info('Webhook job completed', {
    jobId: job.id,
    eventId: job.data.eventId,
    endpointId: job.data.endpointId,
    organizationId: job.data.organizationId,
    attemptsMade: job.attemptsMade,
  });
});

webhookWorker.on('failed', (job, error) => {
  logger.error('Webhook job failed', {
    jobId: job?.id,
    eventId: job?.data.eventId,
    endpointId: job?.data.endpointId,
    organizationId: job?.data.organizationId,
    attemptsMade: job?.attemptsMade,
    error: serializeError(error),
  });
});

webhookWorker.on('error', (error) => {
  logger.error('Webhook worker error', {
    error: serializeError(error),
  });
});

let isShuttingDown = false;

async function shutdown(signal: 'SIGINT' | 'SIGTERM') {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info('Webhook worker shutting down', {
    signal,
  });

  try {
    await webhookWorker.close();
    await queueWorkerRedis.quit();
    logger.info('Webhook worker stopped');
  } catch (error) {
    logger.error('Webhook worker shutdown failed', {
      error: serializeError(error),
    });
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
