import {
  createHmac,
} from 'node:crypto';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  findEvent: vi.fn(),
  findEndpoint: vi.fn(),
  createDelivery: vi.fn(),
  decryptSecret: vi.fn(),
  assertSafeWebhookUrl: vi.fn(),
  fetch: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../modules/events/event.repository.js', () => ({
  eventRepository: {
    findByIdInOrganization: mocks.findEvent,
  },
}));

vi.mock('../../modules/webhooks/webhook.repository.js', () => ({
  webhookRepository: {
    findEndpoint: mocks.findEndpoint,
    createDelivery: mocks.createDelivery,
  },
}));

vi.mock('../../modules/webhooks/webhook-crypto.service.js', () => ({
  webhookCryptoService: {
    decryptSecret: mocks.decryptSecret,
  },
}));

vi.mock('../../modules/webhooks/webhook-url-security.service.js', () => ({
  assertSafeWebhookUrl: mocks.assertSafeWebhookUrl,
}));

vi.mock('../../common/logging/logger.js', () => ({
  logger: {
    info: mocks.info,
    warn: mocks.warn,
    error: mocks.error,
  },
  serializeError: (error: unknown) => ({
    message:
      error instanceof Error
        ? error.message
        : 'Unknown error',
  }),
}));

import {
  processWebhookDelivery,
} from '../../modules/webhooks/webhook-delivery.processor.js';

const job = {
  data: {
    organizationId: 'organization-1',
    eventId: 'event-1',
    endpointId: 'endpoint-1',
  },
  attemptsMade: 0,
} as never;

function eventFixture() {
  return {
    id: 'event-1',
    externalId: 'external-1',
    type: 'domain.updated',
    payload: {
      domain: 'example.com',
    },
    processedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function endpointFixture(active = true) {
  return {
    id: 'endpoint-1',
    url: 'https://webhooks.example.test/delivery',
    active,
    secret: 'encrypted-secret',
  };
}

describe('processWebhookDelivery', () => {
  beforeEach(() => {
    mocks.findEvent.mockReset();
    mocks.findEndpoint.mockReset();
    mocks.createDelivery.mockReset();
    mocks.decryptSecret.mockReset();
    mocks.assertSafeWebhookUrl.mockReset();
    mocks.fetch.mockReset();
    mocks.info.mockReset();
    mocks.warn.mockReset();
    mocks.error.mockReset();

    mocks.findEvent.mockResolvedValue(eventFixture());
    mocks.findEndpoint.mockResolvedValue(endpointFixture());
    mocks.createDelivery.mockResolvedValue({});
    mocks.decryptSecret.mockReturnValue('test-secret');
    mocks.assertSafeWebhookUrl.mockResolvedValue(undefined);
    vi.stubGlobal('fetch', mocks.fetch);
  });

  it('records a successful delivery for an HTTP 2xx response', async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    await expect(
      processWebhookDelivery(job),
    ).resolves.toBeUndefined();

    expect(mocks.createDelivery).toHaveBeenCalledWith({
      endpointId: 'endpoint-1',
      eventId: 'event-1',
      attempt: 1,
      status: 'SUCCESS',
      httpStatus: 204,
    });
  });

  it('sends the expected payload and authenticated HMAC headers', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    try {
      mocks.fetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const event = eventFixture();
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const expectedBody = JSON.stringify({
        id: event.id,
        externalId: event.externalId,
        type: event.type,
        payload: event.payload,
        processedAt: event.processedAt,
      });

      await processWebhookDelivery(job);

      expect(mocks.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = mocks.fetch.mock.calls[0] ?? [];
      const body = options?.body;
      const headers = new Headers(options?.headers);
      const signature = createHmac('sha256', 'test-secret')
        .update(`${timestamp}.${body}`)
        .digest('hex');

      expect(url).toBe('https://webhooks.example.test/delivery');
      expect(options?.method).toBe('POST');
      expect(options?.redirect).toBe('error');
      expect(body).toBe(expectedBody);
      expect(headers.get('content-type')).toBe('application/json');
      expect(headers.get('x-dominiohub-event-id')).toBe('event-1');
      expect(headers.get('x-dominiohub-delivery-id')).toBe(
        'webhook-endpoint-1-event-1',
      );
      expect(headers.get('x-dominiohub-timestamp')).toBe(timestamp);
      expect(headers.get('x-dominiohub-signature')).toBe(
        `sha256=${signature}`,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('records a failed delivery and throws for an HTTP 500 response', async () => {
    mocks.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      processWebhookDelivery(job),
    ).rejects.toThrow(
      'Webhook delivery failed with status 500',
    );

    expect(mocks.createDelivery).toHaveBeenCalledWith({
      endpointId: 'endpoint-1',
      eventId: 'event-1',
      attempt: 1,
      status: 'FAILED',
      httpStatus: 500,
      errorMessage:
        'Webhook delivery failed with status 500',
    });
  });

  it('records a failed delivery and rethrows network errors', async () => {
    const networkError =
      new Error('Network unavailable');

    mocks.fetch.mockRejectedValue(networkError);

    await expect(
      processWebhookDelivery(job),
    ).rejects.toThrow(networkError);

    expect(mocks.createDelivery).toHaveBeenCalledWith({
      endpointId: 'endpoint-1',
      eventId: 'event-1',
      attempt: 1,
      status: 'FAILED',
      errorMessage: 'Network unavailable',
    });
  });

  it('does not execute fetch for an inactive endpoint', async () => {
    mocks.findEndpoint.mockResolvedValue(
      endpointFixture(false),
    );

    await expect(
      processWebhookDelivery(job),
    ).resolves.toBeUndefined();

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.createDelivery).not.toHaveBeenCalled();
  });

  it('does not execute fetch when the endpoint URL is unsafe', async () => {
    const unsafeUrlError = new Error(
      'Webhook URL is not safe',
    );
    mocks.assertSafeWebhookUrl.mockRejectedValue(
      unsafeUrlError,
    );

    await expect(
      processWebhookDelivery(job),
    ).rejects.toThrow(unsafeUrlError);

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.createDelivery).toHaveBeenCalledWith({
      endpointId: 'endpoint-1',
      eventId: 'event-1',
      attempt: 1,
      status: 'FAILED',
      errorMessage: 'Webhook URL is not safe',
    });
  });
});
