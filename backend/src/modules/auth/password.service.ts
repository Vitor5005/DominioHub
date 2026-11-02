import * as argon2 from 'argon2';

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
) {
  return argon2.verify(passwordHash, password);
}