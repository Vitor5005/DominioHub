import { prisma } from '../../infrastructure/database/prisma.js';

import type {
  CreateUserRepositoryData,
  UpdateUserRepositoryData,
} from './user.types.js';

const publicUserSelect = {
  id: true,
  organizationId: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  },

  findByIdInOrganization(
    organizationId: string,
    id: string,
  ) {
    return prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },

      select: publicUserSelect,
    });
  },

  listByOrganization(
    organizationId: string,
  ) {
    return prisma.user.findMany({
      where: {
        organizationId,
      },

      select: publicUserSelect,

      orderBy: {
        name: 'asc',
      },
    });
  },

  create(
    data: CreateUserRepositoryData,
  ) {
    return prisma.user.create({
      data,

      select: publicUserSelect,
    });
  },

  async updateWithinOrganization(
    organizationId: string,
    id: string,
    data: UpdateUserRepositoryData,
  ) {
    const result =
      await prisma.user.updateMany({
        where: {
          id,
          organizationId,
        },

        data,
      });

    if (result.count === 0) {
      return null;
    }

    return prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },

      select: publicUserSelect,
    });
  },
};