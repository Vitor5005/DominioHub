import { Router } from 'express';

import { requireAuth } from '../../common/middlewares/auth.middleware.js';

import {
  loginRateLimiter,
} from '../../common/security/rate-limiters.js';

import { authController } from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post(
  '/login',
  loginRateLimiter,
  authController.login,
);

authRoutes.get(
  '/me',
  requireAuth,
  authController.me,
);
