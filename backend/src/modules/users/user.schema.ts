import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  email: z
    .string()
    .trim()
    .email()
    .transform((email) =>
      email.toLowerCase(),
    ),

  password: z
    .string()
    .min(8)
    .max(128),

  role: z.enum([
    'ADMIN',
    'OPERATOR',
    'SUPPORT',
  ]),
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    role: z
      .enum([
        'ADMIN',
        'OPERATOR',
        'SUPPORT',
      ])
      .optional(),

    active: z
      .boolean()
      .optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        'At least one field must be provided.',
    },
  );

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});