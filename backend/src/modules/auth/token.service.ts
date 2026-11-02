import { jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';

import { env } from '../../config/env.js';

import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from './auth.types.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

const accessTokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.enum(['ADMIN', 'OPERATOR', 'SUPPORT']),
});

export async function signAccessToken(
  user: AuthenticatedUser,
): Promise<string> {
  return new SignJWT({
    organizationId: user.organizationId,
    role: user.role,
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(
    token,
    secret,
    {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithms: ['HS256'],
    },
  );

  const parsedPayload = accessTokenPayloadSchema.safeParse({
    userId: payload.sub,
    organizationId: payload.organizationId,
    role: payload.role,
  });

  if (!parsedPayload.success) {
    throw new Error('Invalid access token payload');
  }

  return parsedPayload.data;
}