import type {
  Role,
} from '../auth/types';

export interface UserRecord {
  id: string;
  organizationId: string;

  name: string;
  email: string;

  role: Role;
  active: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: UserRecord[];
}

export interface UserMutationResponse {
  user: UserRecord;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  active?: boolean;
}