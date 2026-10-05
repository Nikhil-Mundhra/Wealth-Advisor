import type { MiddlewareHandler } from 'hono';
import { constantTimeEqual } from '#core/crypto/constant-time-equal.ts';

const BEARER = 'Bearer ';

// Machine-to-machine check for callers that hold a shared secret (a scheduler), not a user token. The secret is
// read per request, so an unset secret refuses every call instead of accepting an empty bearer.
export function requireBearerSecret(secret: () => string | undefined, reject: () => Error): MiddlewareHandler {
  return async (c, next) => {
    const expected = secret();
    const header = c.req.header('authorization');
    if (!expected || !header?.startsWith(BEARER)) throw reject();
    if (!constantTimeEqual(header.slice(BEARER.length), expected)) throw reject();
    await next();
  };
}
