import {
  createHmac,
} from 'node:crypto';

import type {
  Job,
} from 'bullmq';

import {
  eventRepository,
} from '../events/event.repository.js';

import type {
  WebhookDeliveryJobData,
} from '../../infrastructure/queue/webhook.queue.js';

import {
  webhookCryptoService,
} from './webhook-crypto.service.js';
import {
  webhookRepository,
} from './webhook.repository.js';
import {
  assertSafeWebhookUrl,
} from './webhook-url-security.service.js';
import {
  logger,
  serializeError,
} from '../../common/logging/logger.js';

const webhookTimeoutMilliseconds = 5000;

function errorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Webhook delivery failed';
}

export async function processWebhookDelivery(
  job: Job<WebhookDeliveryJobData>,
) {
  const {
    organizationId,
    eventId,
    endpointId,
  } = job.data;

  const [
    event,
    endpoint,
  ] = await Promise.all([
    eventRepository.findByIdInOrganization(
      organizationId,
      eventId,
    ),
    webhookRepository.findEndpoint(
      organizationId,
      endpointId,
    ),
  ]);

  if (!event) {
    throw new Error('Event not found');
  }

  if (!endpoint) {
    throw new Error('Webhook endpoint not found');
  }

  if (!endpoint.active) {
    return;
  }

  const attempt = job.attemptsMade + 1;

  logger.info('Webhook delivery attempt', {
    eventId,
    endpointId,
    organizationId,
    attempt,
  });

  let response: Response;

  try {
    const secret =
      webhookCryptoService.decryptSecret(
        endpoint.secret,
      );

    const body = JSON.stringify({
      id: event.id,
      externalId: event.externalId,
      type: event.type,
      payload: event.payload,
      processedAt: event.processedAt,
    });

    const timestamp = Math.floor(
      Date.now() / 1000,
    ).toString();

    const signature = createHmac(
      'sha256',
      secret,
    )
      .update(`${timestamp}.${body}`)
      .digest('hex');

    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      webhookTimeoutMilliseconds,
    );

    try {
      await assertSafeWebhookUrl(endpoint.url);

      response = await fetch(
        endpoint.url,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-dominiohub-event-id': event.id,
            'x-dominiohub-timestamp': timestamp,
            'x-dominiohub-signature':
              `sha256=${signature}`,
            'x-dominiohub-delivery-id':
              `webhook-${endpoint.id}-${event.id}`,
          },
          body,
          signal: abortController.signal,
          redirect: 'error',
        },
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    logger.error('Webhook delivery failed', {
      eventId,
      endpointId,
      organizationId,
      attempt,
      error: serializeError(error),
    });

    await webhookRepository.createDelivery({
      endpointId,
      eventId,
      attempt,
      status: 'FAILED',
      errorMessage: errorMessage(error),
    });

    throw error;
  }

  if (!response.ok) {
    logger.warn('Webhook delivery failed', {
      eventId,
      endpointId,
      organizationId,
      attempt,
      responseStatus: response.status,
    });

    await webhookRepository.createDelivery({
      endpointId,
      eventId,
      attempt,
      status: 'FAILED',
      httpStatus: response.status,
      errorMessage:
        `Webhook delivery failed with status ${response.status}`,
    });

    throw new Error(
      `Webhook delivery failed with status ${response.status}`,
    );
  }

  await webhookRepository.createDelivery({
    endpointId,
    eventId,
    attempt,
    status: 'SUCCESS',
    httpStatus: response.status,
  });

  logger.info('Webhook delivery succeeded', {
    eventId,
    endpointId,
    organizationId,
    attempt,
    responseStatus: response.status,
  });
}
