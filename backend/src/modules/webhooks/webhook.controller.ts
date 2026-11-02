import type {
  Request,
  Response,
} from 'express';

import {
  createTenantContext,
} from '../../common/types/tenant-context.js';

import {
  createWebhookEndpointSchema,
  updateWebhookEndpointSchema,
  webhookEndpointIdParamSchema,
} from './webhook.schema.js';

import {
  webhookService,
} from './webhook.service.js';

function unauthorized(
  response: Response,
) {
  return response.status(401).json({
    error: 'UNAUTHORIZED',
    message:
      'Authentication required.',
  });
}

function validationError(
  response: Response,
  message: string,
) {
  return response.status(400).json({
    error: 'VALIDATION_ERROR',
    message,
  });
}

export const webhookController = {
  async listEndpoints(
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

    const endpoints =
      await webhookService.listEndpoints(
        context,
      );

    return response.status(200).json({
      endpoints,
    });
  },

  async createEndpoint(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedInput =
      createWebhookEndpointSchema.safeParse(
        request.body,
      );

    if (!parsedInput.success) {
      return validationError(
        response,
        'Invalid webhook endpoint data.',
      );
    }

    const context =
      createTenantContext(
        request.user,
      );

    const result =
      await webhookService.createEndpoint(
        context,
        parsedInput.data,
      );

    return response.status(201).json(result);
  },

  async updateEndpoint(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedParams =
      webhookEndpointIdParamSchema.safeParse(
        request.params,
      );

    if (!parsedParams.success) {
      return validationError(
        response,
        'Invalid webhook endpoint id.',
      );
    }

    const parsedInput =
      updateWebhookEndpointSchema.safeParse(
        request.body,
      );

    if (!parsedInput.success) {
      return validationError(
        response,
        'Invalid webhook endpoint data.',
      );
    }

    const context =
      createTenantContext(
        request.user,
      );

    const endpoint =
      await webhookService.updateEndpoint(
        context,
        parsedParams.data.endpointId,
        parsedInput.data,
      );

    return response.status(200).json({
      endpoint,
    });
  },

  async listDeliveries(
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

    const deliveries =
      await webhookService.listDeliveries(
        context,
      );

    return response.status(200).json({
      deliveries,
    });
  },
};
