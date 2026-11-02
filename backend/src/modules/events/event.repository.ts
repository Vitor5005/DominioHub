import type {
  Prisma,
} from '../../generated/prisma/client.js';

import {
  prisma,
} from '../../infrastructure/database/prisma.js';

const publicEventSelect = {
  id: true,
  organizationId: true,
  externalId: true,
  type: true,
  payload: true,
  status: true,
  receivedAt: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isUniqueConstraintError(
  error: unknown,
) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code ===
      'P2002'
  );
}

export const eventRepository = {
  listByOrganization(
    organizationId: string,
  ) {
    return prisma.event.findMany({
      where: {
        organizationId,
      },

      select: publicEventSelect,

      orderBy: {
        receivedAt: 'desc',
      },
    });
  },

  findByIdInOrganization(
    organizationId: string,
    eventId: string,
  ) {
    return prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId,
      },

      select: publicEventSelect,
    });
  },

  findByExternalId(
    organizationId: string,
    externalId: string,
  ) {
    return prisma.event.findUnique({
      where: {
        organizationId_externalId: {
          organizationId,
          externalId,
        },
      },

      select: publicEventSelect,
    });
  },

  create(
    organizationId: string,
    externalId: string,
    type: string,
    payload: unknown,
  ) {
    const jsonPayload =
      payload as Prisma.InputJsonValue;

    return prisma.event.create({
      data: {
        organizationId,
        externalId,
        type,
        payload: jsonPayload,
        status: 'PENDING',
      },

      select: publicEventSelect,
    });
  },

  async createOrGet(
    organizationId: string,
    externalId: string,
    type: string,
    payload: unknown,
  ) {
    try {
      const event =
        await this.create(
          organizationId,
          externalId,
          type,
          payload,
        );

      return {
        event,
        created: true,
      };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const event =
        await this.findByExternalId(
          organizationId,
          externalId,
        );

      if (!event) {
        throw error;
      }

      return {
        event,
        created: false,
      };
    }
  },

  markProcessing(
    organizationId: string,
    eventId: string,
  ) {
    return prisma.event.updateMany({
      where: {
        id: eventId,
        organizationId,
      },

      data: {
        status: 'PROCESSING',
      },
    });
  },

  markProcessed(
    organizationId: string,
    eventId: string,
  ) {
    return prisma.event.updateMany({
      where: {
        id: eventId,
        organizationId,
      },

      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  },

  markFailed(
    organizationId: string,
    eventId: string,
  ) {
    return prisma.event.updateMany({
      where: {
        id: eventId,
        organizationId,
      },

      data: {
        status: 'FAILED',
      },
    });
  },
};
