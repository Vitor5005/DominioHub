import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { userRepository } from '../../modules/users/user.repository.js';

import { verifyAccessToken } from "../../modules/auth/token.service.js";

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  const token = authorization
    .slice('Bearer '.length)
    .trim();

  if (!token) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  try {
    const payload = await verifyAccessToken(token);

    const user = await userRepository.findById(
      payload.userId,
    );

    if (!user || !user.active) {
      return response.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication.',
      });
    }

    if (
      user.organizationId !== payload.organizationId ||
      user.role !== payload.role
    ) {
      return response.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication.',
      });
    }

    request.user = {
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired authentication.',
    });
  }
}