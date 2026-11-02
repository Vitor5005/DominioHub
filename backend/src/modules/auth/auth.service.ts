import { userRepository } from '../users/user.repository.js';

import {
  AccountInactiveError,
  InvalidCredentialsError,
} from './auth.errors.js';

import type {
  AuthenticatedUser,
  LoginInput,
} from './auth.types.js';

import { verifyPassword } from './password.service.js';
import { signAccessToken } from './token.service.js';

export const authService = {
  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();

    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      input.password,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      throw new AccountInactiveError();
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = await signAccessToken(
      authenticatedUser,
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      user: authenticatedUser,
    };
  },
};