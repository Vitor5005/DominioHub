import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

import { env } from '../../config/env.js';

const algorithm = 'aes-256-gcm';
const encryptionKey = Buffer.from(
  env.WEBHOOK_SECRET_ENCRYPTION_KEY,
  'base64',
);

function parseEncryptedSecret(
  encryptedSecret: string,
) {
  const parts = encryptedSecret.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted webhook secret');
  }

  const [
    ivBase64,
    authTagBase64,
    ciphertextBase64,
  ] = parts;

  if (
    !ivBase64 ||
    !authTagBase64 ||
    !ciphertextBase64
  ) {
    throw new Error('Invalid encrypted webhook secret');
  }

  return {
    iv: Buffer.from(ivBase64, 'base64'),
    authTag: Buffer.from(authTagBase64, 'base64'),
    ciphertext: Buffer.from(ciphertextBase64, 'base64'),
  };
}

export const webhookCryptoService = {
  generateSecret() {
    return randomBytes(32).toString('hex');
  },

  encryptSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      algorithm,
      encryptionKey,
      iv,
    );

    const ciphertext = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join('.');
  },

  decryptSecret(encryptedSecret: string) {
    const {
      iv,
      authTag,
      ciphertext,
    } = parseEncryptedSecret(encryptedSecret);

    const decipher = createDecipheriv(
      algorithm,
      encryptionKey,
      iv,
    );

    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  },
};
