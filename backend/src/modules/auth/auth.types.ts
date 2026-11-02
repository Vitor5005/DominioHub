import type { Role } from '../../generated/prisma/client.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
}

export interface AccessTokenPayload {
  userId: string;
  organizationId: string;
  role: Role;
}