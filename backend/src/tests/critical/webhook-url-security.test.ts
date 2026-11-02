import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
}));

vi.mock('node:dns/promises', () => ({
  lookup: mocks.lookup,
}));

import {
  WebhookUrlNotAllowedError,
} from '../../modules/webhooks/webhook.errors.js';
import {
  assertSafeWebhookUrl,
} from '../../modules/webhooks/webhook-url-security.service.js';

describe('assertSafeWebhookUrl', () => {
  beforeEach(() => {
    mocks.lookup.mockReset();
  });

  it('rejects localhost, private addresses, IPv6 loopback and credentials', async () => {
    const unsafeUrls = [
      'http://localhost',
      'http://127.0.0.1',
      'http://10.0.0.1',
      'http://192.168.1.10',
      'http://[::1]',
      'https://user:password@example.com',
    ];

    for (const url of unsafeUrls) {
      await expect(
        assertSafeWebhookUrl(url),
      ).rejects.toBeInstanceOf(
        WebhookUrlNotAllowedError,
      );
    }
  });

  it('accepts a hostname resolving only to public addresses', async () => {
    mocks.lookup.mockResolvedValue([
      {
        address: '8.8.8.8',
        family: 4,
      },
    ]);

    await expect(
      assertSafeWebhookUrl(
        'https://webhooks.example.test/delivery',
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects a hostname when any resolved address is private', async () => {
    mocks.lookup.mockResolvedValue([
      {
        address: '8.8.8.8',
        family: 4,
      },
      {
        address: '10.0.0.1',
        family: 4,
      },
    ]);

    await expect(
      assertSafeWebhookUrl(
        'https://webhooks.example.test/delivery',
      ),
    ).rejects.toBeInstanceOf(
      WebhookUrlNotAllowedError,
    );
  });
});
