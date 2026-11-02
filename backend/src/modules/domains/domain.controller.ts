import type {
  Request,
  Response,
} from 'express';

import { z } from 'zod';

import {
  createTenantContext,
} from '../../common/types/tenant-context.js';

import {
  domainService,
} from './domain.service.js';

const domainIdParamSchema =
  z.object({
    domainId: z.string().uuid(),
  });

function unauthorized(
  response: Response,
) {
  return response.status(401).json({
    error: 'UNAUTHORIZED',
    message:
      'Authentication required.',
  });
}

export const domainController = {
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

    const result =
      await domainService.list(
        context,
      );

    return response
      .status(200)
      .json(result);
  },

  async getById(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedParams =
      domainIdParamSchema.safeParse(
        request.params,
      );

    if (!parsedParams.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Invalid domain id.',
      });
    }

    const context =
      createTenantContext(
        request.user,
      );

    const domain =
      await domainService.getById(
        context,
        parsedParams.data.domainId,
      );

    return response.status(200).json({
      domain,
    });
  },

  async sync(
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

    const result =
      await domainService.sync(
        context,
      );

    return response
      .status(200)
      .json(result);
  },
};
