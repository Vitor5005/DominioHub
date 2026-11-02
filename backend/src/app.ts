import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';

import {
  corsOptions,
} from './common/security/cors.js';
import {
  apiRateLimiter,
} from './common/security/rate-limiters.js';

import {
  errorMiddleware,
} from './common/middlewares/error.middleware.js';
import {
  notFoundMiddleware,
} from './common/middlewares/not-found.middleware.js';
import {
  requestContextMiddleware,
} from './common/middlewares/request-context.middleware.js';

import { routes } from './routes.js';

export const app = express();

app.disable('x-powered-by');

if (env.TRUST_PROXY > 0) {
  app.set('trust proxy', env.TRUST_PROXY);
}

app.use(helmet());

app.use(cors(corsOptions));

app.use(requestContextMiddleware);

app.use(express.json({ limit: '256kb' }));

app.get('/api/v1/health', (_request, response) => {
  return response.status(200).json({
    status: 'ok',
    service: 'dominiohub-api',
  });
});

app.use('/api/v1', apiRateLimiter, routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);
