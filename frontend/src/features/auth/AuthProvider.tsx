import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ApiError,
  UNAUTHORIZED_EVENT,
} from '../../services/api-client';

import { authApi } from './auth-api';

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './auth-storage';

import { AuthContext } from './auth-context';

import type {
  AuthenticatedUser,
  AuthStatus,
  LoginInput,
  Permission,
} from './types';

interface AuthProviderProps {
  children: ReactNode;
}

function getInitialStatus(): AuthStatus {
  return getAccessToken()
    ? 'loading'
    : 'anonymous';
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthenticatedUser | null>(
      null,
    );

  const [permissions, setPermissions] =
    useState<Permission[]>([]);

  const [status, setStatus] =
    useState<AuthStatus>(
      getInitialStatus,
    );

  const clearSession = useCallback(() => {
    clearAccessToken();

    setUser(null);
    setPermissions([]);
    setStatus('anonymous');
  }, []);

  const applySession = useCallback(
    (
      authenticatedUser: AuthenticatedUser,
      sessionPermissions: Permission[],
    ) => {
      setUser(authenticatedUser);
      setPermissions([
        ...sessionPermissions,
      ]);
      setStatus('authenticated');
    },
    [],
  );

  const refreshSession =
    useCallback(async () => {
      const accessToken =
        getAccessToken();

      if (!accessToken) {
        clearSession();
        return;
      }

      setStatus('loading');

      try {
        const response =
          await authApi.me();

        applySession(
          response.user,
          response.permissions,
        );
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.statusCode === 401
        ) {
          clearSession();
          return;
        }

        setStatus('error');
      }
    }, [
      applySession,
      clearSession,
    ]);

  const login = useCallback(
    async (input: LoginInput) => {
      const loginResponse =
        await authApi.login(input);

      setAccessToken(
        loginResponse.accessToken,
      );

      try {
        const sessionResponse =
          await authApi.me();

        applySession(
          sessionResponse.user,
          sessionResponse.permissions,
        );
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    [
      applySession,
      clearSession,
    ],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const hasPermission = useCallback(
    (permission: Permission) =>
      permissions.includes(permission),
    [permissions],
  );

  useEffect(() => {
    const accessToken =
      getAccessToken();

    if (!accessToken) {
      return;
    }

    let cancelled = false;

    async function bootstrapSession() {
      try {
        const response =
          await authApi.me();

        if (cancelled) {
          return;
        }

        applySession(
          response.user,
          response.permissions,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (
          error instanceof ApiError &&
          error.statusCode === 401
        ) {
          clearSession();
          return;
        }

        setStatus('error');
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [
    applySession,
    clearSession,
  ]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener(
      UNAUTHORIZED_EVENT,
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        UNAUTHORIZED_EVENT,
        handleUnauthorized,
      );
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      permissions,
      status,
      login,
      logout,
      refreshSession,
      hasPermission,
    }),
    [
      user,
      permissions,
      status,
      login,
      logout,
      refreshSession,
      hasPermission,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}
