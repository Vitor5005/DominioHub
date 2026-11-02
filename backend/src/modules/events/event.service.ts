import type {
  TenantContext,
} from '../../common/types/tenant-context.js';

import {
  eventAuthService,
} from './event-auth.service.js';

import {
  EventNotFoundError,
  EventQueueUnavailableError,
} from './event.errors.js';

import {
  eventRepository,
} from './event.repository.js';

import {
  enqueueEventProcessing,
} from '../../infrastructure/queue/event.queue.js';

import type {
  ReceiveExternalEventInput,
} from './event.types.js';

export const eventService = {
  async receiveExternal(
    input: ReceiveExternalEventInput,
    eventKey: string,
  ) {
    const authenticated =
      await eventAuthService.authenticate(
        input.organizationSlug,
        eventKey,
      );

    const {
      event,
      created,
    } = await eventRepository.createOrGet(
      authenticated.organizationId,
      input.externalId,
      input.type,
      input.payload,
    );

    if (event.status === 'PENDING') {
      try {
        await enqueueEventProcessing(
          event.id,
          event.organizationId,
        );
      } catch {
        throw new EventQueueUnavailableError();
      }
    }

    return {
      event,
      duplicate: !created,
    };
  },

  list(
    context: TenantContext,
  ) {
    return eventRepository
      .listByOrganization(
        context.organizationId,
      );
  },

  async getById(
    context: TenantContext,
    eventId: string,
  ) {
    const event =
      await eventRepository
        .findByIdInOrganization(
          context.organizationId,
          eventId,
        );

    if (!event) {
      throw new EventNotFoundError();
    }

    return event;
  },
};
