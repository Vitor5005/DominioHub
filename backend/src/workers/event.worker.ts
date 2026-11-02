import { Worker } from 'bullmq';

import {
  logger,
  serializeError,
} from '../common/logging/logger.js';

import {
  eventRepository,
} from '../modules/events/event.repository.js';
import {
  processEvent,
} from '../modules/events/event.processor.js';
import {
  queueWorkerRedis,
} from '../infrastructure/queue/queue-connections.js';
import {
  type EventProcessingJobData,
} from '../infrastructure/queue/event.queue.js';

const eventWorker = new Worker<EventProcessingJobData>(
  'event-processing',
  async (job) => {
    await processEvent(
      job.data.organizationId,
      job.data.eventId,
    );
  },
  {
    connection: queueWorkerRedis,
    concurrency: 5,
  },
);

console.log(
  '[WORKER:EVENTS] Worker de eventos iniciado e aguardando jobs.',
);

eventWorker.on('completed', (job) => {
  logger.info('Event job completed', {
    jobId: job.id,
    eventId: job.data.eventId,
    organizationId: job.data.organizationId,
    attemptsMade: job.attemptsMade,
  });
});

eventWorker.on('failed', async (job, error) => {
  if (!job) {
    logger.error('Event job failed', {
      attemptsMade: 0,
      finalAttempt: true,
      error: serializeError(error),
    });
    return;
  }

  const attempts = job.opts.attempts ?? 1;
  const finalAttempt =
    job.attemptsMade >= attempts;

  if (finalAttempt) {
    try {
      const event =
        await eventRepository.findByIdInOrganization(
          job.data.organizationId,
          job.data.eventId,
        );

      if (
        event &&
        event.status !== 'PROCESSED'
      ) {
        await eventRepository.markFailed(
          job.data.organizationId,
          job.data.eventId,
        );
      }
    } catch (markFailedError) {
      logger.error(
        'Unable to update final event status',
        {
          jobId: job.id,
          eventId: job.data.eventId,
          organizationId:
            job.data.organizationId,
          attemptsMade: job.attemptsMade,
          error: serializeError(markFailedError),
        },
      );
    }
  }

  logger.error('Event job failed', {
    jobId: job.id,
    eventId: job.data.eventId,
    organizationId: job.data.organizationId,
    attemptsMade: job.attemptsMade,
    finalAttempt,
    error: serializeError(error),
  });
});

eventWorker.on('error', (error) => {
  logger.error('Event worker error', {
    error: serializeError(error),
  });
});

let isShuttingDown = false;

async function shutdown(signal: 'SIGINT' | 'SIGTERM') {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info('Event worker shutting down', {
    signal,
  });

  try {
    await eventWorker.close();
    await queueWorkerRedis.quit();
    logger.info('Event worker stopped');
  } catch (error) {
    logger.error('Event worker shutdown failed', {
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
