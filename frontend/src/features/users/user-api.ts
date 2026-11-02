import {
  apiRequest,
} from '../../services/api-client';

import type {
  CreateUserInput,
  UpdateUserInput,
  UserListResponse,
  UserMutationResponse,
} from './types';

export const userApi = {
  list() {
    return apiRequest<UserListResponse>(
      '/users',
      {
        method: 'GET',
      },
    );
  },

  create(
    input: CreateUserInput,
  ) {
    return apiRequest<UserMutationResponse>(
      '/users',
      {
        method: 'POST',
        json: input,
      },
    );
  },

  update(
    userId: string,
    input: UpdateUserInput,
  ) {
    return apiRequest<UserMutationResponse>(
      `/users/${encodeURIComponent(
        userId,
      )}`,
      {
        method: 'PATCH',
        json: input,
      },
    );
  },
};