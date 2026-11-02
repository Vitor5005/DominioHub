import type {
  CorsOptions,
} from 'cors';

import { env } from '../../config/env.js';

const allowedOrigins = new Set(
  env.CORS_ALLOWED_ORIGINS
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: false,
  methods: [
    'GET',
    'POST',
    'PATCH',
    'OPTIONS',
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-DominioHub-Event-Key',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'RateLimit',
  ],
};
