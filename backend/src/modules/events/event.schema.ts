import { z } from 'zod';

export const externalEventSchema =
  z.object({
    organizationSlug: z
      .string()
      .trim()
      .min(2)
      .max(100),

    externalId: z
      .string()
      .trim()
      .min(1)
      .max(200),

    type: z
      .string()
      .trim()
      .min(1)
      .max(100),

    payload: z.unknown(),
  });

export const eventIdParamSchema =
  z.object({
    eventId: z.string().uuid(),
  });