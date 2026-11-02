import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  enqueueEventProcessing: vi.fn(),
  enqueueWebhookDelivery: vi.fn(),
  eventCreate: vi.fn(),
  eventFindFirst: vi.fn(),
  eventFindUnique: vi.fn(),
  eventUpdateMany: vi.fn(),
  listActiveEndpoints: vi.fn(),
  loggerInfo: vi.fn(),
}));

vi.mock(
  '../../infrastructure/database/prisma.js',
  () => ({
    prisma: {
      event: {
        create: mocks.eventCreate,
        findFirst: mocks.eventFindFirst,
        findUnique: mocks.eventFindUnique,
        updateMany: mocks.eventUpdateMany,
      },
    },
  }),
);

vi.mock(
  '../../modules/events/event-auth.service.js',
  () => ({
    eventAuthService: {
      authenticate: mocks.authenticate,
    },
  }),
);

vi.mock(
  '../../infrastructure/queue/event.queue.js',
  () => ({
    enqueueEventProcessing:
      mocks.enqueueEventProcessing,
  }),
);

vi.mock(
  '../../modules/webhooks/webhook.repository.js',
  () => ({
    webhookRepository: {
      listActiveEndpoints:
        mocks.listActiveEndpoints,
    },
  }),
);

vi.mock(
  '../../infrastructure/queue/webhook.queue.js',
  () => ({
    enqueueWebhookDelivery:
      mocks.enqueueWebhookDelivery,
  }),
);

vi.mock(
  '../../common/logging/logger.js',
  () => ({
    logger: {
      info: mocks.loggerInfo,
    },
  }),
);

import {
  EventQueueUnavailableError,
} from '../../modules/events/event.errors.js';
import {
  processEvent,
} from '../../modules/events/event.processor.js';
import {
  eventRepository,
} from '../../modules/events/event.repository.js';
import {
  eventService,
} from '../../modules/events/event.service.js';

function eventWithStatus(
  status: string,
) {
  return {
    id: 'event-1',
    organizationId: 'organization-1',
    externalId: 'external-1',
    type: 'domain.updated',
    payload: {},
    status,
    receivedAt: new Date(),
    processedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const input = {
  organizationSlug: 'organization',
  externalId: 'external-1',
  type: 'domain.updated',
  payload: {},
};

beforeEach(() => {
  mocks.authenticate.mockResolvedValue({
    organizationId: 'organization-1',
  });
  mocks.enqueueEventProcessing.mockResolvedValue(
    undefined,
  );
  mocks.enqueueWebhookDelivery.mockResolvedValue(
    undefined,
  );
  mocks.listActiveEndpoints.mockResolvedValue([]);
  mocks.eventUpdateMany.mockResolvedValue({ count: 1 });
});

describe('Event idempotency', () => {
  it('handles createOrGet creation, P2002 recovery, and other failures', async () => {
    const createdEvent = eventWithStatus('PENDING');
    mocks.eventCreate.mockResolvedValue(createdEvent);

    await expect(
      eventRepository.createOrGet(
        'organization-1',
        'external-1',
        'domain.updated',
        {},
      ),
    ).resolves.toEqual({
      event: createdEvent,
      created: true,
    });

    expect(mocks.eventFindUnique).not.toHaveBeenCalled();

    const existingEvent = eventWithStatus('PENDING');
    mocks.eventCreate.mockReset();
    mocks.eventCreate.mockRejectedValue({
      code: 'P2002',
    });
    mocks.eventFindUnique.mockResolvedValue(existingEvent);

    await expect(
      eventRepository.createOrGet(
        'organization-1',
        'external-1',
        'domain.updated',
        {},
      ),
    ).resolves.toEqual({
      event: existingEvent,
      created: false,
    });

    const failure = new Error('database unavailable');
    mocks.eventCreate.mockReset();
    mocks.eventCreate.mockRejectedValue(failure);

    await expect(
      eventRepository.createOrGet(
        'organization-1',
        'external-1',
        'domain.updated',
        {},
      ),
    ).rejects.toBe(failure);
  });

  it('enqueues a new pending event once', async () => {
    const event = eventWithStatus('PENDING');
    vi.spyOn(
      eventRepository,
      'createOrGet',
    ).mockResolvedValue({
      event,
      created: true,
    } as never);

    await expect(
      eventService.receiveExternal(
        input,
        'event-key',
      ),
    ).resolves.toEqual({
      event,
      duplicate: false,
    });

    expect(
      mocks.enqueueEventProcessing,
    ).toHaveBeenCalledTimes(1);
  });

  it('retries enqueueing a duplicate pending event', async () => {
    const event = eventWithStatus('PENDING');
    vi.spyOn(
      eventRepository,
      'createOrGet',
    ).mockResolvedValue({
      event,
      created: false,
    } as never);

    await expect(
      eventService.receiveExternal(
        input,
        'event-key',
      ),
    ).resolves.toEqual({
      event,
      duplicate: true,
    });

    expect(
      mocks.enqueueEventProcessing,
    ).toHaveBeenCalledWith(
      event.id,
      event.organizationId,
    );
  });

  it('does not enqueue a duplicate processed event', async () => {
    const event = eventWithStatus('PROCESSED');
    vi.spyOn(
      eventRepository,
      'createOrGet',
    ).mockResolvedValue({
      event,
      created: false,
    } as never);

    await expect(
      eventService.receiveExternal(
        input,
        'event-key',
      ),
    ).resolves.toEqual({
      event,
      duplicate: true,
    });

    expect(
      mocks.enqueueEventProcessing,
    ).not.toHaveBeenCalled();
  });

  it('turns an enqueue failure into EventQueueUnavailableError', async () => {
    vi.spyOn(
      eventRepository,
      'createOrGet',
    ).mockResolvedValue({
      event: eventWithStatus('PENDING'),
      created: true,
    } as never);
    mocks.enqueueEventProcessing.mockRejectedValue(
      new Error('queue unavailable'),
    );

    await expect(
      eventService.receiveExternal(
        input,
        'event-key',
      ),
    ).rejects.toBeInstanceOf(
      EventQueueUnavailableError,
    );
  });

  it('skips main processing for processed and failed events', async () => {
    mocks.eventFindFirst.mockResolvedValue(
      eventWithStatus('PROCESSED'),
    );

    await processEvent(
      'organization-1',
      'event-1',
    );

    expect(
      mocks.eventUpdateMany,
    ).not.toHaveBeenCalled();

    mocks.eventFindFirst.mockReset();
    mocks.eventUpdateMany.mockClear();
    mocks.enqueueWebhookDelivery.mockClear();
    mocks.eventFindFirst.mockResolvedValue(
      eventWithStatus('FAILED'),
    );

    await processEvent(
      'organization-1',
      'event-1',
    );

    expect(
      mocks.eventUpdateMany,
    ).not.toHaveBeenCalled();
    expect(
      mocks.enqueueWebhookDelivery,
    ).not.toHaveBeenCalled();
  });

  it('processes a pending event before dispatching active webhooks', async () => {
    mocks.eventFindFirst.mockResolvedValue(
      eventWithStatus('PENDING'),
    );
    mocks.listActiveEndpoints.mockResolvedValue([
      { id: 'endpoint-1' },
    ]);

    await processEvent(
      'organization-1',
      'event-1',
    );

    expect(
      mocks.eventUpdateMany,
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: { status: 'PROCESSING' },
      }),
    );
    expect(
      mocks.eventUpdateMany,
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PROCESSED',
        }),
      }),
    );
    expect(
      mocks.enqueueWebhookDelivery,
    ).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
      'endpoint-1',
    );
  });
});
