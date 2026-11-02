import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  AppError,
} from '../errors/app-error.js';
import {
  logger,
  serializeError,
} from '../logging/logger.js';

function isInvalidJsonError(
  error: unknown,
) {
  if (
    !(error instanceof SyntaxError) ||
    typeof error !== 'object' ||
    error === null
  ) {
    return false;
  }

  const status =
    (error as {
      status?: unknown;
      statusCode?: unknown;
    }).status;

  const statusCode =
    (error as {
      status?: unknown;
      statusCode?: unknown;
    }).statusCode;

  return status === 400 || statusCode === 400;
}

function isPayloadTooLargeError(
  error: unknown,
) {
  if (
    typeof error !== 'object' ||
    error === null
  ) {
    return false;
  }

  const {
    status,
    statusCode,
    type,
  } = error as {
    status?: unknown;
    statusCode?: unknown;
    type?: unknown;
  };

  return (
    status === 413 ||
    statusCode === 413 ||
    type === 'entity.too.large'
  );
}

export function errorMiddleware(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    logger.warn(
      'Handled application error',
      {
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        statusCode: error.statusCode,
        errorCode: error.code,
      },
    );

    return response.status(error.statusCode).json({
      error: error.code,
      message: error.publicMessage,
    });
  }

  if (isPayloadTooLargeError(error)) {
    logger.warn(
      'Request body too large',
      {
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        errorCode: 'PAYLOAD_TOO_LARGE',
      },
    );

    return response.status(413).json({
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Request body is too large.',
    });
  }

  if (isInvalidJsonError(error)) {
    logger.warn(
      'Invalid JSON body',
      {
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        errorCode: 'INVALID_JSON',
      },
    );

    return response.status(400).json({
      error: 'INVALID_JSON',
      message: 'Invalid JSON body.',
    });
  }

  logger.error(
    'Unhandled request error',
    {
      requestId: request.requestId,
      method: request.method,
      path: request.path,
      error: serializeError(error),
    },
  );

  return response.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected internal server error.',
  });
}
