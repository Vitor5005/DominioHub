import { Router } from 'express';

import {
  requireAuth,
} from '../../common/middlewares/auth.middleware.js';

import {
  requirePermission,
} from '../../common/middlewares/permission.middleware.js';

import {
  userController,
} from './user.controller.js';

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get(
  '/',
  requirePermission('users:read'),
  userController.list,
);

userRoutes.post(
  '/',
  requirePermission('users:manage'),
  userController.create,
);

userRoutes.patch(
  '/:userId',
  requirePermission('users:manage'),
  userController.update,
);