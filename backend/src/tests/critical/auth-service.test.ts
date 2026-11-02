import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  userRepository: {
    findByEmail: vi.fn(),
  },
  verifyPassword: vi.fn(),
  signAccessToken: vi.fn(),
}));

vi.mock(
  '../../modules/users/user.repository.js',
  () => ({ userRepository: mocks.userRepository }),
);

vi.mock(
  '../../modules/auth/password.service.js',
  () => ({ verifyPassword: mocks.verifyPassword }),
);

vi.mock(
  '../../modules/auth/token.service.js',
  () => ({ signAccessToken: mocks.signAccessToken }),
);

import {
  AccountInactiveError,
  InvalidCredentialsError,
} from '../../modules/auth/auth.errors.js';
import {
  authService,
} from '../../modules/auth/auth.service.js';

const user = {
  id: 'user-1',
  organizationId: 'organization-1',
  name: 'Alice Admin',
  email: 'alice@example.com',
  passwordHash: 'password-hash',
  role: 'ADMIN',
  active: true,
};

describe('auth service login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authenticates valid credentials and returns a bearer token', async () => {
    mocks.userRepository.findByEmail.mockResolvedValue(
      user,
    );
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.signAccessToken.mockResolvedValue('access-token');

    await expect(
      authService.login({
        email: '  ALICE@EXAMPLE.COM  ',
        password: 'correct-password',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      user: {
        id: user.id,
        organizationId: user.organizationId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    expect(
      mocks.userRepository.findByEmail,
    ).toHaveBeenCalledWith('alice@example.com');
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      user.passwordHash,
      'correct-password',
    );
    expect(mocks.signAccessToken).toHaveBeenCalledWith({
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });

  it('rejects invalid passwords without issuing a token', async () => {
    mocks.userRepository.findByEmail.mockResolvedValue(
      user,
    );
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(
      authService.login({
        email: user.email,
        password: 'incorrect-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(mocks.signAccessToken).not.toHaveBeenCalled();
  });

  it('rejects nonexistent users as invalid credentials', async () => {
    mocks.userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'any-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.signAccessToken).not.toHaveBeenCalled();
  });

  it('rejects inactive users without issuing a token', async () => {
    mocks.userRepository.findByEmail.mockResolvedValue({
      ...user,
      active: false,
    });
    mocks.verifyPassword.mockResolvedValue(true);

    await expect(
      authService.login({
        email: user.email,
        password: 'correct-password',
      }),
    ).rejects.toBeInstanceOf(AccountInactiveError);

    expect(mocks.signAccessToken).not.toHaveBeenCalled();
  });
});
