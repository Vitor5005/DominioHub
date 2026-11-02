export type Role =
  | 'ADMIN'
  | 'OPERATOR'
  | 'SUPPORT';

export type Permission =
  | 'users:read'
  | 'users:manage'
  | 'domains:read'
  | 'domains:manage'
  | 'events:read'
  | 'webhooks:read'
  | 'webhooks:manage'
  | 'chat:use';

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthenticatedUser;
}

export interface MeResponse {
  user: AuthenticatedUser;
  permissions: Permission[];
}

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'anonymous'
  | 'error';
