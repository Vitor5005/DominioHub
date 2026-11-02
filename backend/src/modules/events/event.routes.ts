import { Router } from 'express';

import {
  requireAuth,
} from '../../common/middlewares/auth.middleware.js';

import {
  externalEventRateLimiter,
} from '../../common/security/rate-limiters.js';

import {
  requirePermission,
} from '../../common/middlewares/permission.middleware.js';

import {
  eventController,
} from './event.controller.js';

export const eventRoutes =
  Router();

eventRoutes.post(
  '/external',
  externalEventRateLimiter,
  eventController.receiveExternal,
);

eventRoutes.get(
  '/',
  requireAuth,
  requirePermission(
    'events:read',
  ),
  eventController.list,
);

eventRoutes.get(
  '/:eventId',
  requireAuth,
  requirePermission(
    'events:read',
  ),
  eventController.getById,
);
