import type {
  Request,
  Response,
} from 'express';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  userRepository: {
    findById: vi.fn(),
  },
  verifyAccessToken: vi.fn(),
}));

vi.mock(
  '../../modules/users/user.repository.js',
  () => ({ userRepository: mocks.userRepository }),
);

vi.mock(
  '../../modules/auth/token.service.js',
  () => ({ verifyAccessToken: mocks.verifyAccessToken }),
);

import {
  requireAuth,
} from '../../common/middlewares/auth.middleware.js';
import {
  requirePermission,
} from '../../common/middlewares/permission.middleware.js';

function createRequest(
  headers: Record<string, string> = {},
) {
  return {
    headers,
  } as unknown as Request;
}

function createResponse() {
  const status = vi.fn();
  const json = vi.fn();
  const response = {
    status,
    json,
  };

  status.mockReturnValue(response);

  return response;
}

describe('authentication and permission middlewares', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests without bearer authentication', async () => {
    const request = createRequest();
    const response = createResponse();
    const next = vi.fn();

    await requireAuth(
      request,
      response as unknown as Response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid bearer tokens', async () => {
    const request = createRequest({
      authorization: 'Bearer invalid-token',
    });
    const response = createResponse();
    const next = vi.fn();

    mocks.verifyAccessToken.mockRejectedValue(
      new Error('invalid token'),
    );

    await requireAuth(
      request,
      response as unknown as Response,
      next,
    );

    expect(mocks.verifyAccessToken).toHaveBeenCalledWith(
      'invalid-token',
    );
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired authentication.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('authenticates a valid bearer token and populates the request user', async () => {
    const request = createRequest({
      authorization: 'Bearer valid-token',
    });
    const response = createResponse();
    const next = vi.fn();

    mocks.verifyAccessToken.mockResolvedValue({
      userId: 'user-1',
      organizationId: 'organization-1',
      role: 'ADMIN',
    });
    mocks.userRepository.findById.mockResolvedValue({
      id: 'user-1',
      organizationId: 'organization-1',
      name: 'Alice Admin',
      email: 'alice@example.com',
      role: 'ADMIN',
      active: true,
    });

    await requireAuth(
      request,
      response as unknown as Response,
      next,
    );

    expect(mocks.verifyAccessToken).toHaveBeenCalledWith(
      'valid-token',
    );
    expect(mocks.userRepository.findById).toHaveBeenCalledWith(
      'user-1',
    );
    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
    expect(request.user).toEqual({
      id: 'user-1',
      organizationId: 'organization-1',
      name: 'Alice Admin',
      email: 'alice@example.com',
      role: 'ADMIN',
    });
  });

  it('allows an authorized role through the requested permission', () => {
    const request = {
      ...createRequest(),
      user: {
        id: 'user-1',
        organizationId: 'organization-1',
        name: 'Alice Admin',
        email: 'alice@example.com',
        role: 'ADMIN',
      },
    } as unknown as Request;
    const response = createResponse();
    const next = vi.fn();

    requirePermission('users:manage')(
      request,
      response as unknown as Response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it('forbids a role without the requested permission', () => {
    const request = {
      ...createRequest(),
      user: {
        id: 'user-2',
        organizationId: 'organization-1',
        name: 'Sam Support',
        email: 'sam@example.com',
        role: 'SUPPORT',
      },
    } as unknown as Request;
    const response = createResponse();
    const next = vi.fn();

    requirePermission('users:manage')(
      request,
      response as unknown as Response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: 'FORBIDDEN',
      message:
        'You do not have permission to perform this action.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
