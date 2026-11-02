import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ApiError,
} from '../../services/api-client';

import {
  userApi,
} from './user-api';

import type {
  CreateUserInput,
  UpdateUserInput,
  UserRecord,
} from './types';

type UsersStatus =
  | 'loading'
  | 'success'
  | 'error';

interface UsersLoadError {
  message: string;

  requestId:
    | string
    | null;
}

function sortUsers(
  users: UserRecord[],
) {
  return [...users].sort(
    (left, right) =>
      left.name.localeCompare(
        right.name,
        'pt-BR',
        {
          sensitivity: 'base',
        },
      ),
  );
}

function getLoadError(
  error: unknown,
): UsersLoadError {
  if (
    !(error instanceof ApiError)
  ) {
    return {
      message:
        'Não foi possível carregar os usuários.',

      requestId: null,
    };
  }

  if (
    error.statusCode === 0
  ) {
    return {
      message:
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',

      requestId: null,
    };
  }

  if (
    error.statusCode === 403
  ) {
    return {
      message:
        'Sua conta não possui permissão para visualizar usuários.',

      requestId:
        error.requestId,
    };
  }

  if (
    error.statusCode >= 500
  ) {
    return {
      message:
        'O DomínioHub está temporariamente indisponível. Tente novamente em instantes.',

      requestId:
        error.requestId,
    };
  }

  return {
    message:
      error.message ||
      'Não foi possível carregar os usuários.',

    requestId:
      error.requestId,
  };
}

export function useUsersData() {
  const [
    users,
    setUsers,
  ] =
    useState<UserRecord[]>([]);

  const [
    status,
    setStatus,
  ] =
    useState<UsersStatus>(
      'loading',
    );

  const [
    error,
    setError,
  ] =
    useState<UsersLoadError | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const response =
          await userApi.list();

        if (cancelled) {
          return;
        }

        setUsers(
          sortUsers(
            response.users,
          ),
        );

        setError(null);
        setStatus('success');
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          getLoadError(
            caughtError,
          ),
        );

        setStatus('error');
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh =
    useCallback(async () => {
      setStatus('loading');
      setError(null);

      try {
        const response =
          await userApi.list();

        setUsers(
          sortUsers(
            response.users,
          ),
        );

        setStatus('success');
      } catch (caughtError) {
        setError(
          getLoadError(
            caughtError,
          ),
        );

        setStatus('error');
      }
    }, []);

  const createUser =
    useCallback(
      async (
        input:
          CreateUserInput,
      ) => {
        const response =
          await userApi.create(
            input,
          );

        setUsers(
          (current) =>
            sortUsers([
              ...current,
              response.user,
            ]),
        );

        return response.user;
      },
      [],
    );

  const updateUser =
    useCallback(
      async (
        userId: string,
        input:
          UpdateUserInput,
      ) => {
        const response =
          await userApi.update(
            userId,
            input,
          );

        setUsers(
          (current) =>
            sortUsers(
              current.map(
                (user) =>
                  user.id ===
                  response.user.id
                    ? response.user
                    : user,
              ),
            ),
        );

        return response.user;
      },
      [],
    );

  return {
    users,
    status,
    error,

    refresh,
    createUser,
    updateUser,
  };
}