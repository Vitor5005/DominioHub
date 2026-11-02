import type {
  Request,
  Response,
} from 'express';

export function notFoundMiddleware(
  _request: Request,
  response: Response,
) {
  return response.status(404).json({
    error: 'ROUTE_NOT_FOUND',
    message: 'Route not found.',
  });
}
