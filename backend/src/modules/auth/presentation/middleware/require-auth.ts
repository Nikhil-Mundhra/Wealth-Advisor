import type { Context, MiddlewareHandler } from 'hono';
import type { AccessTokenSignerPort } from '../../application/ports/access-token-signer.port.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';

export interface AuthPrincipal {
  readonly userId: string;
  readonly roles: readonly string[];
}

declare module 'hono' {
  interface ContextVariableMap {
    principal: AuthPrincipal;
  }
}

const BEARER = 'Bearer ';

// Verifies the Bearer access token and exposes the caller as c.get('principal').
export function requireAuth(signer: AccessTokenSignerPort): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header('authorization');
    if (!header?.startsWith(BEARER)) throw AuthErrors.unauthenticated();
    const claims = await signer.verify(header.slice(BEARER.length));
    c.set('principal', { userId: claims.subject, roles: claims.roles });
    await next();
  };
}

export function getPrincipal(c: Context): AuthPrincipal {
  const principal = c.get('principal');
  if (!principal) throw AuthErrors.unauthenticated();
  return principal;
}
