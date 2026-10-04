import { randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

// Opaque, URL-safe random token (256 bits).
export function generateOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}
