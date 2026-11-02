import 'dotenv/config';
import { z } from 'zod';

function isWebhookSecretEncryptionKey(
  value: string,
) {
  const key = Buffer.from(value, 'base64');

  return (
    key.length === 32 &&
    key.toString('base64') === value
  );
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().positive().default(3000),

  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173'),

  TRUST_PROXY: z.coerce
    .number()
    .int()
    .min(0)
    .default(0),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z
  .string()
  .min(32, 'JWT_SECRET must have at least 32 characters'),

  JWT_EXPIRES_IN: z
    .string()
    .default('8h'),

  JWT_ISSUER: z
    .string()
    .default('dominiohub-api'),

  JWT_AUDIENCE: z
    .string()
    .default('dominiohub-web'),

  DOMAIN_PROVIDER: z
  .enum(['mock'])
  .default('mock'),

  REDIS_URL: z
  .string()
  .min(1, 'REDIS_URL is required')
  .default('redis://localhost:6379'),

  WEBHOOK_SECRET_ENCRYPTION_KEY: z
    .string()
    .refine(
      isWebhookSecretEncryptionKey,
      'WEBHOOK_SECRET_ENCRYPTION_KEY must be base64 for exactly 32 bytes',
    ),

  AI_PROVIDER: z
    .enum(['gemini'])
    .default('gemini'),

  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY is required'),

  GEMINI_MODEL: z
    .string()
    .min(1)
    .default('gemini-3.5-flash-lite'),

  AI_HISTORY_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(20),

  AI_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(120000),

  CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(300),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsedEnv.data;

