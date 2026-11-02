import { Redis } from 'ioredis';

import { env } from '../../config/env.js';
import {
  logger,
  serializeError,
} from '../../common/logging/logger.js';

export const redis = new Redis(
  env.REDIS_URL,
  {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    enableOfflineQueue: false,
  },
);

redis.on('error', (error) => {
  logger.error('Redis connection error', {
    error: serializeError(error),
  });
});
