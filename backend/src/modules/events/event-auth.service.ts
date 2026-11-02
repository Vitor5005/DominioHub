import {
  createHash,
  timingSafeEqual,
} from 'node:crypto';

import {
  organizationRepository,
} from '../organizations/organization.repository.js';

import {
  InvalidEventCredentialsError,
} from './event.errors.js';

function hashKey(
  key: string,
): string {
  return createHash('sha256')
    .update(key)
    .digest('hex');
}

function secureHashComparison(
  receivedHash: string,
  expectedHash: string,
): boolean {
  const received =
    Buffer.from(receivedHash, 'hex');

  const expected =
    Buffer.from(expectedHash, 'hex');

  if (
    received.length !==
    expected.length
  ) {
    return false;
  }

  return timingSafeEqual(
    received,
    expected,
  );
}

export const eventAuthService = {
  async authenticate(
    organizationSlug: string,
    eventKey: string,
  ) {
    const organization =
      await organizationRepository
        .findEventIngestConfiguration(
          organizationSlug,
        );

    if (
      !organization ||
      !organization.eventIngestKeyHash
    ) {
      throw new InvalidEventCredentialsError();
    }

    const receivedHash =
      hashKey(eventKey);

    if (
      !secureHashComparison(
        receivedHash,
        organization.eventIngestKeyHash,
      )
    ) {
      throw new InvalidEventCredentialsError();
    }

    return {
      organizationId:
        organization.id,
    };
  },
};