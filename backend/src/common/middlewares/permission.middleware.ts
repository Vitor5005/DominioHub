import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  hasPermission,
  type Permission,
} from '../../modules/auth/permissions.js';

export function requirePermission(
  permission: Permission,
) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    if (!request.user) {
      return response.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (
      !hasPermission(
        request.user.role,
        permission,
      )
    ) {
      return response.status(403).json({
        error: 'FORBIDDEN',
        message:
          'You do not have permission to perform this action.',
      });
    }

    return next();
  };
}