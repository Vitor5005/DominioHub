import {
  lookup,
} from 'node:dns/promises';
import {
  BlockList,
  isIP,
} from 'node:net';

import {
  WebhookUrlNotAllowedError,
} from './webhook.errors.js';

const ipv4BlockList = new BlockList();
const ipv6BlockList = new BlockList();

const ipv4Ranges: Array<
  readonly [string, number]
> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

for (const [address, prefix] of ipv4Ranges) {
  ipv4BlockList.addSubnet(
    address,
    prefix,
    'ipv4',
  );

  ipv6BlockList.addSubnet(
    `::ffff:${address}`,
    prefix + 96,
    'ipv6',
  );
}

const ipv6Ranges: Array<
  readonly [string, number]
> = [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
  ['2001:db8::', 32],
];

for (const [address, prefix] of ipv6Ranges) {
  ipv6BlockList.addSubnet(
    address,
    prefix,
    'ipv6',
  );
}

function rejectWebhookUrl(): never {
  throw new WebhookUrlNotAllowedError();
}

function isBlockedAddress(
  address: string,
) {
  const family = isIP(address);

  if (family === 4) {
    return ipv4BlockList.check(
      address,
      'ipv4',
    );
  }

  if (family === 6) {
    return ipv6BlockList.check(
      address,
      'ipv6',
    );
  }

  return true;
}

export async function assertSafeWebhookUrl(
  value: string,
): Promise<void> {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    rejectWebhookUrl();
  }

  if (
    url.protocol !== 'http:' &&
    url.protocol !== 'https:'
  ) {
    rejectWebhookUrl();
  }

  if (url.username || url.password) {
    rejectWebhookUrl();
  }

  const hostname = url.hostname
    .replace(/^\[/, '')
    .replace(/\]$/, '');
  const normalizedHostname =
    hostname.toLowerCase();

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname.endsWith('.localhost') ||
    normalizedHostname.endsWith('.local')
  ) {
    rejectWebhookUrl();
  }

  const literalFamily = isIP(hostname);
  let addresses: string[];

  if (literalFamily !== 0) {
    addresses = [hostname];
  } else {
    try {
      const resolved = await lookup(
        hostname,
        {
          all: true,
          verbatim: true,
        },
      );

      addresses = resolved.map(
        (result) => result.address,
      );
    } catch {
      rejectWebhookUrl();
    }
  }

  if (
    addresses.length === 0 ||
    addresses.some(isBlockedAddress)
  ) {
    rejectWebhookUrl();
  }
}
