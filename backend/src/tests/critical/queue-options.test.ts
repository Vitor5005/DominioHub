import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => {
  const queueConfigurations: unknown[][] = [];

  return {
    queueAdd: vi.fn(),
    queueConfigurations,
    queueProducerRedis: {},
  };
});

vi.mock('bullmq', () => ({
  Queue: class {
    constructor(...args: unknown[]) {
      mocks.queueConfigurations.push(args);
    }

    add(...args: unknown[]) {
      return mocks.queueAdd(...args);
    }
  },
}));

vi.mock(
  '../../infrastructure/queue/queue-connections.js',
  () => ({
    queueProducerRedis: mocks.queueProducerRedis,
  }),
);

import {
  enqueueEventProcessing,
} from '../../infrastructure/queue/event.queue.js';
import {
  enqueueWebhookDelivery,
} from '../../infrastructure/queue/webhook.queue.js';

describe('queue retry and deduplication options', () => {
  beforeEach(() => {
    mocks.queueAdd.mockReset();
    mocks.queueAdd.mockResolvedValue(undefined);
  });

  it('configures event processing retries with exponential backoff', () => {
    expect(
      mocks.queueConfigurations,
    ).toContainEqual([
      'event-processing',
      expect.objectContaining({
        connection: mocks.queueProducerRedis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            delay: 1000,
            type: 'exponential',
          },
          removeOnComplete: {
            count: 100,
          },
          removeOnFail: {
            count: 500,
          },
        },
      }),
    ]);
  });

  it('enqueues event processing with a deterministic job id', async () => {
    await enqueueEventProcessing(
      'event-1',
      'organization-1',
    );

    expect(mocks.queueAdd).toHaveBeenCalledWith(
      'process-event',
      {
        eventId: 'event-1',
        organizationId: 'organization-1',
      },
      {
        jobId: 'event-event-1',
      },
    );
  });

  it('configures webhook delivery retries with exponential backoff', () => {
    expect(
      mocks.queueConfigurations,
    ).toContainEqual([
      'webhook-delivery',
      expect.objectContaining({
        connection: mocks.queueProducerRedis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            delay: 2000,
            type: 'exponential',
          },
          removeOnComplete: {
            count: 100,
          },
          removeOnFail: {
            count: 500,
          },
        },
      }),
    ]);
  });

  it('enqueues webhook delivery with a deterministic job id', async () => {
    await enqueueWebhookDelivery(
      'organization-1',
      'event-1',
      'endpoint-1',
    );

    expect(mocks.queueAdd).toHaveBeenCalledWith(
      'deliver-webhook',
      {
        endpointId: 'endpoint-1',
        eventId: 'event-1',
        organizationId: 'organization-1',
      },
      {
        jobId: 'webhook-endpoint-1-event-1',
      },
    );
  });
});
