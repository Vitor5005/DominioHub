import type {
  WebhookDeliveryStatus,
} from '../../generated/prisma/client.js';

import {
  prisma,
} from '../../infrastructure/database/prisma.js';

const publicWebhookEndpointSelect = {
  id: true,
  organizationId: true,
  name: true,
  url: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const internalWebhookEndpointSelect = {
  ...publicWebhookEndpointSelect,
  secret: true,
} as const;

const publicWebhookDeliverySelect = {
  id: true,
  endpointId: true,
  eventId: true,
  attempt: true,
  status: true,
  httpStatus: true,
  errorMessage: true,
  attemptedAt: true,
  endpoint: {
    select: publicWebhookEndpointSelect,
  },
  event: {
    select: {
      id: true,
      organizationId: true,
      externalId: true,
      type: true,
      status: true,
      receivedAt: true,
      processedAt: true,
    },
  },
} as const;

export type UpdateWebhookEndpointInput = {
  url?: string | undefined;
  active?: boolean | undefined;
};

export type CreateWebhookDeliveryInput = {
  endpointId: string;
  eventId: string;
  attempt: number;
  status: WebhookDeliveryStatus;
  httpStatus?: number;
  errorMessage?: string;
};

export const webhookRepository = {
  listEndpoints(
    organizationId: string,
  ) {
    return prisma.webhookEndpoint.findMany({
      where: {
        organizationId,
      },

      select: publicWebhookEndpointSelect,

      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  listActiveEndpoints(
    organizationId: string,
  ) {
    return prisma.webhookEndpoint.findMany({
      where: {
        organizationId,
        active: true,
      },

      select: publicWebhookEndpointSelect,

      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  findEndpoint(
    organizationId: string,
    endpointId: string,
  ) {
    return prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        organizationId,
      },

      select: internalWebhookEndpointSelect,
    });
  },

  createEndpoint(
    organizationId: string,
    url: string,
    encryptedSecret: string,
  ) {
    return prisma.webhookEndpoint.create({
      data: {
        organizationId,
        name: url,
        url,
        secret: encryptedSecret,
      },

      select: publicWebhookEndpointSelect,
    });
  },

  async updateEndpoint(
    organizationId: string,
    endpointId: string,
    input: UpdateWebhookEndpointInput,
  ) {
    const updated =
      await prisma.webhookEndpoint.updateMany({
        where: {
          id: endpointId,
          organizationId,
        },

        data: {
          ...(input.url !== undefined
            ? {
              url: input.url,
              name: input.url,
            }
            : {}),

          ...(input.active !== undefined
            ? {
              active: input.active,
            }
            : {}),
        },
      });

    if (updated.count === 0) {
      return null;
    }

    return prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        organizationId,
      },

      select: publicWebhookEndpointSelect,
    });
  },

  listDeliveries(
    organizationId: string,
  ) {
    return prisma.webhookDelivery.findMany({
      where: {
        endpoint: {
          is: {
            organizationId,
          },
        },
        event: {
          is: {
            organizationId,
          },
        },
      },

      select: publicWebhookDeliverySelect,

      orderBy: {
        attemptedAt: 'desc',
      },
    });
  },

  createDelivery(
    input: CreateWebhookDeliveryInput,
  ) {
    return prisma.webhookDelivery.create({
      data: {
        endpointId: input.endpointId,
        eventId: input.eventId,
        attempt: input.attempt,
        status: input.status,
        ...(input.httpStatus !== undefined
          ? { httpStatus: input.httpStatus }
          : {}),
        ...(input.errorMessage !== undefined
          ? { errorMessage: input.errorMessage }
          : {}),
      },

      select: publicWebhookDeliverySelect,
    });
  },
};
