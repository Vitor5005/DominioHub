import type {
  Request,
  Response,
} from 'express';

import {
  getPermissionsForRole,
} from '../../modules/auth/permissions.js';

import { loginSchema } from './auth.schema.js';
import { authService } from './auth.service.js';

export const authController = {
  async login(
    request: Request,
    response: Response,
  ) {
    const parsedInput = loginSchema.safeParse(
      request.body,
    );

    if (!parsedInput.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid login data.',
        details: parsedInput.error.flatten().fieldErrors,
      });
    }

    const result = await authService.login(
      parsedInput.data,
    );

    return response.status(200).json(result);
  },

  async me(
    request: Request,
    response: Response,
  ) {
    if (!request.user) {
      return response.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    return response.status(200).json({
      user: request.user,

      permissions:
        getPermissionsForRole(
          request.user.role,
        ),
    });
  },
};
