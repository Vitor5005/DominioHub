import {
  rateLimit,
} from 'express-rate-limit';
import type {
  Request,
  Response,
} from 'express';

const rateLimitHandler = (
  _request: Request,
  response: Response,
) => response.status(429).json({
  error: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many requests. Please try again later.',
});

const standardOptions = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: rateLimitHandler,
};

export const apiRateLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

export const loginRateLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const externalEventRateLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  limit: 120,
});

export const chatRateLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 1000,
  limit: 30,
});
