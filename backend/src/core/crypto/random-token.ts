import { randomBytes } from 'node:crypto';

// Opaque, URL-safe random token of the given byte length.
export function generateOpaqueToken(bytes: number): string {
  return randomBytes(bytes).toString('base64url');
}
