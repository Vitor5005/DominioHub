import { z } from 'zod';

export const createConversationSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional(),
  });

export const sendMessageSchema =
  z.object({
    content: z
      .string()
      .trim()
      .min(1)
      .max(4000),
  });

export const conversationIdParamSchema =
  z.object({
    conversationId: z.string().uuid(),
  });
