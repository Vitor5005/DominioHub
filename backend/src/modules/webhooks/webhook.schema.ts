import { z } from 'zod';

const webhookUrlSchema = z
  .string()
  .refine(
    (value) => {
      try {
        const url = new URL(value);

        return (
          url.protocol === 'http:' ||
          url.protocol === 'https:'
        );
      } catch {
        return false;
      }
    },
    {
      message:
        'Webhook URL must use HTTP or HTTPS.',
    },
  );

export const createWebhookEndpointSchema =
  z.object({
    url: webhookUrlSchema,
  });

export const updateWebhookEndpointSchema =
  z
    .object({
      url: webhookUrlSchema.optional(),
      active: z.boolean().optional(),
    })
    .refine(
      (input) =>
        input.url !== undefined ||
        input.active !== undefined,
      {
        message:
          'At least one field is required.',
      },
    );

export const webhookEndpointIdParamSchema =
  z.object({
    endpointId: z.string().uuid(),
  });
