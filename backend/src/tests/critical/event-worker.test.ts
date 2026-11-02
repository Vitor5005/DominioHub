import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  findByIdInOrganization: vi.fn(),
  handlers: new Map<
    string,
    (...args: unknown[]) => unknown
  >(),
  info: vi.fn(),
  markFailed: vi.fn(),
  processEvent: vi.fn(),
  processor: undefined as
    | ((job: unknown) => Promise<void>)
    | undefined,
}));

vi.mock('bullmq', () => ({
  Worker: class {
    constructor(
      _name: string,
      processor: (job: unknown) => Promise<void>,
    ) {
      mocks.processor = processor;
    }

    on(
      event: string,
      handler: (...args: unknown[]) => unknown,
    ) {
      mocks.handlers.set(event, handler);

      return this;
    }

    async close() {}
  },
}));

vi.mock(
  '../../common/logging/logger.js',
  () => ({
    logger: {
      error: mocks.error,
      info: mocks.info,
    },
    serializeError: (error: unknown) => ({
      message:
        error instanceof Error
          ? error.message
          : 'Unknown error',
    }),
  }),
);

vi.mock(
  '../../infrastructure/queue/queue-connections.js',
  () => ({
    queueWorkerRedis: {
      quit: vi.fn(),
    },
  }),
);

vi.mock(
  '../../modules/events/event.processor.js',
  () => ({
    processEvent: mocks.processEvent,
  }),
);

vi.mock(
  '../../modules/events/event.repository.js',
  () => ({
    eventRepository: {
      findByIdInOrganization:
        mocks.findByIdInOrganization,
      markFailed: mocks.markFailed,
    },
  }),
);

import '../../workers/event.worker.js';

function finalFailedJob() {
  return {
    data: {
      eventId: 'event-1',
      organizationId: 'organization-1',
    },
    id: 'job-1',
    attemptsMade: 3,
    opts: {
      attempts: 3,
    },
  };
}

function failedHandler() {
  const handler = mocks.handlers.get('failed');

  if (!handler) {
    throw new Error('Event worker failed handler was not registered');
  }

  return handler;
}

describe('event worker final failures', () => {
  beforeEach(() => {
    mocks.error.mockReset();
    mocks.findByIdInOrganization.mockReset();
    mocks.info.mockReset();
    mocks.markFailed.mockReset();
    mocks.markFailed.mockResolvedValue(undefined);
  });

  it('processes a valid event job', async () => {
    const processor = mocks.processor;

    if (!processor) {
      throw new Error('Event worker processor was not registered');
    }

    mocks.processEvent.mockReset();

    await processor({
      data: {
        organizationId: 'organization-1',
        eventId: 'event-1',
      },
      id: 'job-1',
    });

    expect(mocks.processEvent).toHaveBeenCalledTimes(1);
    expect(mocks.processEvent).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });

  it('does not mark a processed event as failed', async () => {
    mocks.findByIdInOrganization.mockResolvedValue({
      status: 'PROCESSED',
    });

    await failedHandler()(
      finalFailedJob(),
      new Error('Webhook dispatch failed'),
    );

    expect(
      mocks.findByIdInOrganization,
    ).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
    expect(mocks.markFailed).not.toHaveBeenCalled();
  });

  it('marks a non-processed event as failed on its final attempt', async () => {
    mocks.findByIdInOrganization.mockResolvedValue({
      status: 'PROCESSING',
    });

    await failedHandler()(
      finalFailedJob(),
      new Error('Event processing failed'),
    );

    expect(mocks.markFailed).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });
});
