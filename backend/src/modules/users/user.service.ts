import type { TenantContext } from '../../common/types/tenant-context.js';

import {
  hashPassword,
} from '../auth/password.service.js';

import {
  UserEmailAlreadyExistsError,
  UserNotFoundError,
  UserSelfProtectionError,
} from './user.errors.js';

import { userRepository } from './user.repository.js';

import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserRepositoryData,
} from './user.types.js';

export const userService = {
  list(
    context: TenantContext,
  ) {
    return userRepository.listByOrganization(
      context.organizationId,
    );
  },

  async create(
    context: TenantContext,
    input: CreateUserInput,
  ) {
    const existingUser =
      await userRepository.findByEmail(
        input.email,
      );

    if (existingUser) {
      throw new UserEmailAlreadyExistsError();
    }

    const passwordHash =
      await hashPassword(input.password);

    return userRepository.create({
      organizationId:
        context.organizationId,

      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });
  },

  async update(
    context: TenantContext,
    actorUserId: string,
    userId: string,
    input: UpdateUserInput,
  ) {
    const existingUser =
      await userRepository.findByIdInOrganization(
        context.organizationId,
        userId,
      );

    if (!existingUser) {
      throw new UserNotFoundError();
    }

    if (
      userId === actorUserId &&
      (
        input.active === false ||
        (
          input.role !== undefined &&
          input.role !== 'ADMIN'
        )
      )
    ) {
      throw new UserSelfProtectionError();
    }

    const updateData:
      UpdateUserRepositoryData = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    if (input.active !== undefined) {
      updateData.active = input.active;
    }

    const updatedUser =
      await userRepository.updateWithinOrganization(
        context.organizationId,
        userId,
        updateData,
      );

    if (!updatedUser) {
      throw new UserNotFoundError();
    }

    return updatedUser;
  },
};