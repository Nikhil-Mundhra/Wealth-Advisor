import { createHash } from 'node:crypto';

// SHA-256 as lowercase hex. Used for refresh tokens, which are random enough that no salt is needed.
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
