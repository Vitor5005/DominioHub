import {
  eventRepository,
} from './event.repository.js';
import {
  webhookRepository,
} from '../webhooks/webhook.repository.js';
import {
  enqueueWebhookDelivery,
} from '../../infrastructure/queue/webhook.queue.js';
import {
  logger,
} from '../../common/logging/logger.js';

async function enqueueActiveWebhookDeliveries(
  organizationId: string,
  eventId: string,
) {
  const endpoints =
    await webhookRepository.listActiveEndpoints(
      organizationId,
    );

  await Promise.all(
    endpoints.map((endpoint) =>
      enqueueWebhookDelivery(
        organizationId,
        eventId,
        endpoint.id,
      ),
    ),
  );
}

export async function processEvent(
  organizationId: string,
  eventId: string,
) {
  const event =
    await eventRepository.findByIdInOrganization(
      organizationId,
      eventId,
    );

  if (!event) {
    throw new Error('Event not found');
  }

  logger.info('Processing event', {
    eventId,
    organizationId,
    status: event.status,
  });

  if (event.status === 'PROCESSED') {
    logger.info('Event processing skipped', {
      eventId,
      organizationId,
      status: event.status,
    });

    await enqueueActiveWebhookDeliveries(
      organizationId,
      eventId,
    );

    return;
  }

  if (event.status === 'FAILED') {
    logger.info('Event processing skipped', {
      eventId,
      organizationId,
      status: event.status,
    });

    return;
  }

  await eventRepository.markProcessing(
    organizationId,
    eventId,
  );

  await eventRepository.markProcessed(
    organizationId,
    eventId,
  );

  logger.info('Event processed', {
    eventId,
    organizationId,
  });

  await enqueueActiveWebhookDeliveries(
    organizationId,
    eventId,
  );
}
