import { Router } from 'express';

import {
  requireAuth,
} from '../../common/middlewares/auth.middleware.js';

import {
  requirePermission,
} from '../../common/middlewares/permission.middleware.js';

import {
  domainController,
} from './domain.controller.js';

export const domainRoutes =
  Router();

domainRoutes.use(requireAuth);

domainRoutes.get(
  '/',
  requirePermission(
    'domains:read',
  ),
  domainController.list,
);

domainRoutes.get(
  '/:domainId',
  requirePermission(
    'domains:read',
  ),
  domainController.getById,
);

domainRoutes.post(
  '/sync',
  requirePermission(
    'domains:manage',
  ),
  domainController.sync,
);