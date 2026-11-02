import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  findByIdInOrganization: vi.fn(),
  updateWithinOrganization: vi.fn(),
}));

vi.mock(
  '../../modules/users/user.repository.js',
  () => ({ userRepository: mocks }),
);

import {
  UserNotFoundError,
} from '../../modules/users/user.errors.js';
import {
  userService,
} from '../../modules/users/user.service.js';

describe('user tenant isolation', () => {
  it('rejects updating a user from another organization by ID', async () => {
    const context = {
      organizationId: 'organization-1',
    };

    mocks.findByIdInOrganization.mockResolvedValue(null);

    await expect(
      userService.update(
        context,
        'admin-1',
        'user-from-organization-2',
        {
          name: 'Tentativa cross tenant',
        },
      ),
    ).rejects.toBeInstanceOf(UserNotFoundError);

    expect(mocks.findByIdInOrganization).toHaveBeenCalledTimes(1);
    expect(mocks.findByIdInOrganization).toHaveBeenCalledWith(
      'organization-1',
      'user-from-organization-2',
    );
    expect(mocks.updateWithinOrganization).not.toHaveBeenCalled();
  });
});
