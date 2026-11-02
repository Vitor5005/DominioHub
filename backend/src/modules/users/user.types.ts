import type { Role } from '../../generated/prisma/client.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  name?: string | undefined;
  role?: Role | undefined;
  active?: boolean | undefined;
}

export interface CreateUserRepositoryData {
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface UpdateUserRepositoryData {
  name?: string;
  role?: Role;
  active?: boolean;
}