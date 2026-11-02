import { Router } from 'express';

import {
  requireAuth,
} from '../../common/middlewares/auth.middleware.js';

import {
  requirePermission,
} from '../../common/middlewares/permission.middleware.js';

import {
  chatRateLimiter,
} from '../../common/security/rate-limiters.js';

import {
  chatController,
} from './chat.controller.js';

export const chatRoutes = Router();

chatRoutes.use(requireAuth);

chatRoutes.use(
  requirePermission('chat:use'),
);

chatRoutes.get(
  '/conversations',
  chatController.listConversations,
);

chatRoutes.post(
  '/conversations',
  chatController.createConversation,
);

chatRoutes.get(
  '/conversations/:conversationId',
  chatController.getConversation,
);

chatRoutes.post(
  '/conversations/:conversationId/messages',
  chatRateLimiter,
  chatController.sendMessage,
);
