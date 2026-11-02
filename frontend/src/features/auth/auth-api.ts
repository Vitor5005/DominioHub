import { apiRequest } from '../../services/api-client';

import type {
  LoginInput,
  LoginResponse,
  MeResponse,
} from './types';

export const authApi = {
  login(input: LoginInput) {
    return apiRequest<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        auth: false,
        json: input,
      },
    );
  },

  me() {
    return apiRequest<MeResponse>(
      '/auth/me',
      {
        method: 'GET',
      },
    );
  },
};
