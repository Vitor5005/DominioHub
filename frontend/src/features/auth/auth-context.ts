import { createContext } from 'react';

import type {
  AuthenticatedUser,
  AuthStatus,
  LoginInput,
  Permission,
} from './types';

export interface AuthContextValue {
  user: AuthenticatedUser | null;
  permissions: readonly Permission[];
  status: AuthStatus;

  login(
    input: LoginInput,
  ): Promise<void>;

  logout(): void;

  refreshSession(): Promise<void>;

  hasPermission(
    permission: Permission,
  ): boolean;
}

export const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );
