import { Router } from 'express';

import { authRoutes } from './modules/auth/auth.routes.js';

import { userRoutes, } from './modules/users/user.routes.js';

import { domainRoutes, } from './modules/domains/domain.routes.js';

import { eventRoutes, } from './modules/events/event.routes.js';

import { webhookRoutes, } from './modules/webhooks/webhook.routes.js';

import { chatRoutes, } from './modules/chat/chat.routes.js';

export const routes = Router();

routes.use('/auth', authRoutes);

routes.use('/users', userRoutes,);

routes.use('/domains', domainRoutes,);

routes.use('/events', eventRoutes,);

routes.use('/webhooks', webhookRoutes,);

routes.use('/chat', chatRoutes,);
