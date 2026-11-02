import { Redis } from 'ioredis';

import { env } from '../../config/env.js';

export const queueProducerRedis = new Redis(
  env.REDIS_URL,
  {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    enableOfflineQueue: false,
  },
);

export const queueWorkerRedis = new Redis(
  env.REDIS_URL,
  {
    maxRetriesPerRequest: null,
  },
);
