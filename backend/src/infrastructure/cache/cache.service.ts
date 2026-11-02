import { env } from '../../config/env.js';

import { redis } from './redis.js';
import {
  logger,
  serializeError,
} from '../../common/logging/logger.js';

export type CacheLookup<T> =
  | {
      status: 'HIT';
      value: T;
    }
  | {
      status: 'MISS' | 'BYPASS';
      value: null;
    };

export const cacheService = {
  async getJson<T>(
    key: string,
  ): Promise<CacheLookup<T>> {
    try {
      const value =
        await redis.get(key);

      if (value === null) {
        return {
          status: 'MISS',
          value: null,
        };
      }

      return {
        status: 'HIT',
        value: JSON.parse(value) as T,
      };
    } catch (error) {
      logger.warn('Cache read failed', {
        operation: 'read',
        error: serializeError(error),
      });

      return {
        status: 'BYPASS',
        value: null,
      };
    }
  },

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds =
      env.CACHE_TTL_SECONDS,
  ): Promise<boolean> {
    try {
      await redis.set(
        key,
        JSON.stringify(value),
        'EX',
        ttlSeconds,
      );

      return true;
    } catch (error) {
      logger.warn('Cache write failed', {
        operation: 'write',
        error: serializeError(error),
      });

      return false;
    }
  },

  async delete(
    key: string,
  ): Promise<boolean> {
    try {
      await redis.del(key);

      return true;
    } catch (error) {
      logger.warn('Cache invalidation failed', {
        operation: 'invalidation',
        error: serializeError(error),
      });

      return false;
    }
  },
};
