import { createHash, timingSafeEqual } from 'node:crypto';

// Both sides are hashed first: timingSafeEqual needs equal lengths, and comparing raw lengths would leak the
// secret's length through the early exit.
export function constantTimeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
