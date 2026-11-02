import type {
  Request,
  Response,
} from 'express';

import {
  createTenantContext,
} from '../../common/types/tenant-context.js';

import {
  eventIdParamSchema,
  externalEventSchema,
} from './event.schema.js';

import {
  eventService,
} from './event.service.js';

function unauthorized(
  response: Response,
) {
  return response.status(401).json({
    error: 'UNAUTHORIZED',
    message:
      'Authentication required.',
  });
}

export const eventController = {
  async receiveExternal(
    request: Request,
    response: Response,
  ) {
    const parsedInput =
      externalEventSchema.safeParse(
        request.body,
      );

    if (!parsedInput.success) {
      return response
        .status(400)
        .json({
          error:
            'VALIDATION_ERROR',

          message:
            'Invalid event data.',

          details:
            parsedInput.error
              .flatten()
              .fieldErrors,
        });
    }

    const eventKeyHeader =
      request.headers[
        'x-dominiohub-event-key'
      ];

    if (
      typeof eventKeyHeader !==
        'string' ||
      eventKeyHeader.length === 0
    ) {
      return response
        .status(401)
        .json({
          error:
            'INVALID_EVENT_CREDENTIALS',

          message:
            'Invalid event credentials.',
        });
    }

    const result =
      await eventService
        .receiveExternal(
          parsedInput.data,
          eventKeyHeader,
        );

    return response
      .status(202)
      .json(result);
  },

  async list(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const context =
      createTenantContext(
        request.user,
      );

    const events =
      await eventService.list(
        context,
      );

    return response
      .status(200)
      .json({
        events,
      });
  },

  async getById(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedParams =
      eventIdParamSchema.safeParse(
        request.params,
      );

    if (!parsedParams.success) {
      return response
        .status(400)
        .json({
          error:
            'VALIDATION_ERROR',

          message:
            'Invalid event id.',
        });
    }

    const context =
      createTenantContext(
        request.user,
      );

    const event =
      await eventService.getById(
        context,
        parsedParams.data.eventId,
      );

    return response
      .status(200)
      .json({
        event,
      });
  },
};
