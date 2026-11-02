import type {
  Request,
  Response,
} from 'express';

import {
  createTenantContext,
} from '../../common/types/tenant-context.js';

import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from './user.schema.js';

import { userService } from './user.service.js';

function unauthorized(
  response: Response,
) {
  return response.status(401).json({
    error: 'UNAUTHORIZED',
    message: 'Authentication required.',
  });
}

export const userController = {
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

    const users =
      await userService.list(context);

    return response.status(200).json({
      users,
    });
  },

  async create(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedInput =
      createUserSchema.safeParse(
        request.body,
      );

    if (!parsedInput.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid user data.',
        details:
          parsedInput.error.flatten()
            .fieldErrors,
      });
    }

    const context =
      createTenantContext(
        request.user,
      );

    const user =
      await userService.create(
        context,
        parsedInput.data,
      );

    return response
      .status(201)
      .json({
        user,
      });
  },

  async update(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return unauthorized(response);
    }

    const parsedParams =
      userIdParamSchema.safeParse(
        request.params,
      );

    if (!parsedParams.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid user id.',
      });
    }

    const parsedInput =
      updateUserSchema.safeParse(
        request.body,
      );

    if (!parsedInput.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid user data.',
        details:
          parsedInput.error.flatten()
            .fieldErrors,
      });
    }

    const context =
      createTenantContext(
        request.user,
      );

    const user =
      await userService.update(
        context,
        request.user.id,
        parsedParams.data.userId,
        parsedInput.data,
      );

    return response.status(200).json({
      user,
    });
  },
};
