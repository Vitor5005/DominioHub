import type {
  TenantContext,
} from '../../common/types/tenant-context.js';

import {
  WebhookEndpointNotFoundError,
} from './webhook.errors.js';

import {
  webhookCryptoService,
} from './webhook-crypto.service.js';

import {
  webhookRepository,
} from './webhook.repository.js';
import {
  assertSafeWebhookUrl,
} from './webhook-url-security.service.js';

import type {
  UpdateWebhookEndpointInput,
} from './webhook.repository.js';

export const webhookService = {
  listEndpoints(
    context: TenantContext,
  ) {
    return webhookRepository.listEndpoints(
      context.organizationId,
    );
  },

  async createEndpoint(
    context: TenantContext,
    input: {
      url: string;
    },
  ) {
    await assertSafeWebhookUrl(input.url);

    const secret =
      webhookCryptoService.generateSecret();

    const encryptedSecret =
      webhookCryptoService.encryptSecret(secret);

    const endpoint =
      await webhookRepository.createEndpoint(
        context.organizationId,
        input.url,
        encryptedSecret,
      );

    return {
      endpoint,
      secret,
    };
  },

  async updateEndpoint(
    context: TenantContext,
    endpointId: string,
    input: UpdateWebhookEndpointInput,
  ) {
    if (input.url !== undefined) {
      await assertSafeWebhookUrl(input.url);
    }

    const endpoint =
      await webhookRepository.updateEndpoint(
        context.organizationId,
        endpointId,
        input,
      );

    if (!endpoint) {
      throw new WebhookEndpointNotFoundError();
    }

    return endpoint;
  },

  listDeliveries(
    context: TenantContext,
  ) {
    return webhookRepository.listDeliveries(
      context.organizationId,
    );
  },
};
