import { randomUUID } from 'node:crypto';

import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  logger,
} from '../logging/logger.js';

const requestIdPattern =
  /^[A-Za-z0-9._-]{1,100}$/;

export function requestContextMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const headerRequestId =
    request.headers['x-request-id'];

  const requestId =
    typeof headerRequestId === 'string' &&
    requestIdPattern.test(headerRequestId)
      ? headerRequestId
      : randomUUID();

  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);

  const startedAt = process.hrtime.bigint();

  response.on('finish', () => {
    const durationMs =
      Number(process.hrtime.bigint() - startedAt) /
      1_000_000;

    const fields: Record<string, unknown> = {
      requestId,
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs,
    };

    if (request.user) {
      fields.userId = request.user.id;
      fields.organizationId =
        request.user.organizationId;
      fields.role = request.user.role;
    }

    if (request.path === '/api/v1/health') {
      return;
    }

    logger.info(
      'HTTP request completed',
      fields,
    );
  });

  next();
}
