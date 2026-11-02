import { Router } from 'express';

import {
  requireAuth,
} from '../../common/middlewares/auth.middleware.js';

import {
  requirePermission,
} from '../../common/middlewares/permission.middleware.js';

import {
  webhookController,
} from './webhook.controller.js';

export const webhookRoutes =
  Router();

webhookRoutes.use(requireAuth);

webhookRoutes.get(
  '/endpoints',
  requirePermission(
    'webhooks:read',
  ),
  webhookController.listEndpoints,
);

webhookRoutes.post(
  '/endpoints',
  requirePermission(
    'webhooks:manage',
  ),
  webhookController.createEndpoint,
);

webhookRoutes.patch(
  '/endpoints/:endpointId',
  requirePermission(
    'webhooks:manage',
  ),
  webhookController.updateEndpoint,
);

webhookRoutes.get(
  '/deliveries',
  requirePermission(
    'webhooks:read',
  ),
  webhookController.listDeliveries,
);
